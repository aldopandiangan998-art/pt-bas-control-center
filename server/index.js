import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import db, { initDb, syncJournalsAndWaybills, syncBkkAndInvoices, bkkUploadsDir } from './db.js';
import {
  RO_TYPES,
  ITEM_TYPES,
  normalizeRoType,
  getItemType,
  validateRoItems,
} from './roRules.js';

let nodemailer = null;
try {
  const nm = await import('nodemailer');
  nodemailer = nm.default || nm;
} catch (e) {
  // nodemailer is optional in dev/offline mode
}

// Initialize SQLite database
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

export function getCustomerPrefix(custNameOrObj) {
  if (!custNameOrObj) return 'GEN';
  if (typeof custNameOrObj === 'object') {
    if (custNameOrObj.kodePrefix) return custNameOrObj.kodePrefix.replace(/\s+/g, '').toUpperCase();
    if (custNameOrObj.name) custNameOrObj = custNameOrObj.name;
    else return 'GEN';
  }
  const custName = String(custNameOrObj).trim();
  
  const normalize = (s) => s.toLowerCase().replace(/\b(pt|cv|tbk|persero)\b/gi, '').replace(/[^a-z0-9]/g, '').trim();
  const targetNorm = normalize(custName);

  const customers = db.prepare('SELECT id, name, alias, kodePrefix FROM customers').all();

  // 1. Exact match on name or alias (case-insensitive)
  let found = customers.find((c) => c.name?.toLowerCase() === custName.toLowerCase() || c.alias?.toLowerCase() === custName.toLowerCase());

  // 2. Normalized match (ignoring PT, CV, punctuation)
  if (!found) {
    found = customers.find((c) => normalize(c.name || '') === targetNorm || (c.alias && normalize(c.alias) === targetNorm));
  }

  // 3. Exact match with kodePrefix
  if (!found) {
    found = customers.find((c) => c.kodePrefix && c.kodePrefix.toLowerCase() === custName.toLowerCase());
  }

  // 4. Word boundary match on kodePrefix (avoid false substring matches like 'si' in 'solusi')
  if (!found) {
    found = customers.find((c) => {
      if (!c.kodePrefix) return false;
      const cleanPrefix = c.kodePrefix.replace(/\s+/g, '');
      const regex = new RegExp('(\\b|[^a-zA-Z0-9])' + cleanPrefix + '(\\b|[^a-zA-Z0-9])', 'i');
      return regex.test(custName);
    });
  }

  if (found && found.kodePrefix) {
    return found.kodePrefix.replace(/\s+/g, '').toUpperCase();
  }
  const clean = custName
    .replace(/\b(PT|CV|TBK|PERSERO)\b/gi, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
  return clean.slice(0, 4) || 'GEN';
}

export function generateNomorRO(custNameOrObj, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const monthYear = `${mm}${yyyy}`;
  const prefix = getCustomerPrefix(custNameOrObj);

  const rows = db.prepare(`
    SELECT nomorRO FROM pre_orders WHERE nomorRO IS NOT NULL
    UNION
    SELECT nomorRO FROM surat_jalan WHERE nomorRO IS NOT NULL
    UNION
    SELECT nomorRO FROM jurnal_gi WHERE nomorRO IS NOT NULL
    UNION
    SELECT nomorRO FROM invoices WHERE nomorRO IS NOT NULL
  `).all();

  let maxSeq = 0;
  for (const r of rows) {
    if (!r.nomorRO) continue;
    const match = r.nomorRO.match(new RegExp(`-${monthYear}-(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `RO-${prefix}-${monthYear}-${nextSeq}`;
}

export function generatePoNumber(custNameOrObj, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const monthYear = `${mm}${yyyy}`;
  const prefix = getCustomerPrefix(custNameOrObj);

  const rows = db.prepare(`
    SELECT nomorPo as poNum FROM pre_orders WHERE nomorPo IS NOT NULL
    UNION
    SELECT nomorPoCustomer as poNum FROM pre_orders WHERE nomorPoCustomer IS NOT NULL
    UNION
    SELECT poNumber as poNum FROM surat_jalan WHERE poNumber IS NOT NULL
    UNION
    SELECT poNumber as poNum FROM jurnal_gi WHERE poNumber IS NOT NULL
    UNION
    SELECT poNumber as poNum FROM invoices WHERE poNumber IS NOT NULL
  `).all();

  let maxSeq = 0;
  for (const r of rows) {
    if (!r.poNum || r.poNum === 'MENUNGGU SURAT JALAN PERTAMA' || r.poNum.startsWith('PO-DRAFT-')) continue;
    const match = r.poNum.match(new RegExp(`-${monthYear}-(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `PO-${prefix}-${monthYear}-${nextSeq}`;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Node.js v24 + SQLite (node:sqlite)',
    system: 'PT Berkah Alam Semesta Logistics Control ERP',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTHENTICATION ROUTES (Strictly Admin & Superadmin)
// ==========================================

/**
 * Aturan Penentuan Role Otomatis Berdasarkan Email:
 * - superadmin@ptbas.co.id / email pimpinan / awalan superadmin -> superadmin (Super Admin)
 * - Email lainnya (dummy admin & user baru) -> admin (Admin)
 */
function determineRoleByEmail(email) {
  if (!email) return { role: 'admin', roleLabel: 'Admin' };
  const cleanEmail = email.trim().toLowerCase();

  // rainorchesta@gmail.com explicitly has the Admin role
  if (cleanEmail === 'rainorchesta@gmail.com') {
    return {
      role: 'admin',
      roleLabel: 'Admin',
    };
  }

  const superAdminList = [
    'superadmin@ptbas.co.id',
    'direksi@ptbas.co.id',
    'david.rusiah@ptbas.co.id',
  ];

  if (superAdminList.includes(cleanEmail) || cleanEmail.startsWith('superadmin')) {
    return {
      role: 'superadmin',
      roleLabel: 'Super Admin',
    };
  }

  return {
    role: 'admin',
    roleLabel: 'Admin',
  };
}

/**
 * Verifikasi Hak Akses Super Admin untuk Operasi Sensitif (Hapus Data)
 * Memeriksa header/query x-user-role, x-user-email, x-user-id dan mencocokkan ke database users SQLite.
 * Mencegah Admin melakukan bypass langsung ke API DELETE.
 */
function verifySuperAdminPermission(req, res, actionName = 'menghapus data') {
  const roleHeader = (req.headers['x-user-role'] || req.query.user_role || '').toLowerCase().trim();
  const cleanRole = roleHeader.replace(/[\s_-]+/g, '');
  const emailHeader = (req.headers['x-user-email'] || req.query.user_email || '').toLowerCase().trim();
  const idHeader = (req.headers['x-user-id'] || req.query.user_id || '').trim();

  // Jika eksplisit menyatakan role admin murni, tolak langsung
  if (cleanRole === 'admin') {
    res.status(403).json({
      success: false,
      message: `Akses ditolak: Pengguna dengan role Admin tidak memiliki wewenang untuk ${actionName}. Hanya Super Admin yang diizinkan.`
    });
    return false;
  }

  // Jika menyertakan identitas (email atau id), verifikasi validitas akun dan role di database
  if (emailHeader || idHeader) {
    try {
      const user = db.prepare('SELECT id, email, role, aktif FROM users WHERE id = ? OR LOWER(email) = ?').get(idHeader || '', emailHeader || '');
      if (user) {
        const autoRole = determineRoleByEmail(user.email);
        const userCleanRole = String(user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
        const isSuper = userCleanRole === 'superadmin' || autoRole.role === 'superadmin' || userCleanRole === 'direktur' || userCleanRole === 'direksi';
        if (!isSuper || user.aktif !== 1) {
          res.status(403).json({
            success: false,
            message: `Akses ditolak: Akun ${user.email} tidak memiliki hak akses Super Admin untuk ${actionName}.`
          });
          return false;
        }
        return true;
      }
    } catch (err) {
      console.error('Error verifying superadmin permission:', err);
    }
  }

  // Jika header menyatakan role superadmin dan tidak ada konflik identitas
  if (cleanRole === 'superadmin' || cleanRole === 'direktur' || cleanRole === 'direksi') {
    return true;
  }

  // Email matching superadmin list
  // rainorchesta@gmail.com explicitly has the Admin role
  if (emailHeader === 'rainorchesta@gmail.com') {
    res.status(403).json({
      success: false,
      message: `Akses ditolak: Akun rainorchesta@gmail.com memiliki wewenang Admin dan tidak memiliki hak akses Super Admin untuk ${actionName}.`
    });
    return false;
  }

  const superAdminList = ['superadmin@ptbas.co.id', 'direksi@ptbas.co.id', 'david.rusiah@ptbas.co.id'];
  if (superAdminList.includes(emailHeader) || emailHeader.startsWith('superadmin')) {
    return true;
  }

  // Default: tolak jika tidak ada bukti hak Super Admin yang sah
  res.status(403).json({
    success: false,
    message: `Akses ditolak: Operasi ${actionName} memerlukan wewenang Super Admin.`
  });
  return false;
}

/**
 * Helper to record immutable audit trail entries for Cash-Out (BKK) transactions
 */
function logBkkAudit(bkkId, action, actorName, actorRole, details = null, actorId = null) {
  try {
    const id = `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;
    db.prepare(`
      INSERT INTO bkk_audit_logs (id, bkkId, action, actorId, actorName, actorRole, details, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, bkkId, action, actorId || null, actorName || 'System', actorRole || 'User', detailsStr, nowIso, nowIso);
  } catch (err) {
    console.error('Error logging BKK audit:', err);
  }
}

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare('SELECT id, name, email, password, role, roleLabel, branch, phone, birth_date, gender, avatar, aktif FROM users WHERE LOWER(email) = ?')
    .get(cleanEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Email atau kata sandi tidak valid. Pastikan data akun benar.',
    });
  }

  // Validasi persetujuan akun: Admin baru harus disetujui Super Admin (aktif = 1)
  if (user.aktif === 0 || !user.aktif) {
    return res.status(403).json({
      success: false,
      isPendingApproval: true,
      userName: user.name,
      userEmail: user.email,
      message: 'Akun Anda sedang menunggu persetujuan (approval) dari Super Admin. Silakan hubungi Super Admin untuk aktivasi.',
    });
  }

  // Sinkronisasi role otomatis sesuai kriteria email
  const autoRole = determineRoleByEmail(cleanEmail);
  if (user.role !== autoRole.role || user.roleLabel !== autoRole.roleLabel) {
    db.prepare('UPDATE users SET role = ?, roleLabel = ? WHERE id = ?').run(
      autoRole.role,
      autoRole.roleLabel,
      user.id
    );
    user.role = autoRole.role;
    user.roleLabel = autoRole.roleLabel;
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Register (Pendaftaran Admin baru wajib melalui approval Super Admin)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, branch = 'Hub Gresik', phone = '-', birth_date = null, gender = 'Laki-laki' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Harap lengkapi seluruh field wajib.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if exists
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `Email ${email} sudah terdaftar dalam sistem PT BAS.`,
    });
  }

  // Penentuan role: superadmin email langsung aktif, akun Admin baru membutuhkan approval (aktif = 0)
  const autoRole = determineRoleByEmail(cleanEmail);
  const isSuper = autoRole.role === 'superadmin';
  const aktif = isSuper ? 1 : 0; // Admin baru wajib butuh approval Super Admin
  const id = `usr-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), cleanEmail, password, autoRole.role, autoRole.roleLabel, branch, phone, birth_date, gender, aktif, now);

  const newUser = {
    id,
    name: name.trim(),
    email: cleanEmail,
    role: autoRole.role,
    roleLabel: autoRole.roleLabel,
    branch,
    phone,
    birth_date,
    gender,
    aktif,
    created_at: now,
  };

  res.status(201).json({
    success: true,
    pendingApproval: !isSuper,
    message: isSuper
      ? 'Akun Super Admin berhasil dibuat!'
      : 'Pendaftaran akun Admin berhasil! Akun Anda sedang menunggu persetujuan dari Super Admin.',
    user: newUser,
  });
});

// ==========================================
// PASSWORD RESET / FORGOT PASSWORD (OPTION B)
// ==========================================

// Request password reset link (sent via Gmail / dev fallback)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Alamat email wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = ?').get(cleanEmail);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `Email ${cleanEmail} tidak terdaftar dalam sistem PT BAS.`,
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 15 * 60 * 1000; // 15 menit

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(
    token,
    expires,
    user.id
  );

  // Dapatkan frontend URL dari origin atau referer
  let origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
  if (!origin) {
    origin = `http://localhost:${process.env.VITE_PORT || 5173}`;
  }
  const resetUrl = `${origin}/reset-password?token=${token}`;

  let emailSent = false;
  let emailNotice = '';

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const mailOptions = {
        from: `"PT Berkah Alam Semesta Dispatch" <${gmailUser}>`,
        to: user.email,
        subject: 'Permintaan Reset Kata Sandi Akun PT BAS Dispatch ERP',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #f4511e; margin: 0;">PT BERKAH ALAM SEMESTA</h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Logistics & Mining Dispatch Control Center</p>
            </div>
            <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155;">
              <h3 style="color: #ffffff; margin-top: 0;">Halo, ${user.name}</h3>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Kami menerima permintaan untuk mereset kata sandi akun Anda di Portal PT BAS Control Center.
                Silakan klik tautan tombol di bawah ini untuk mengatur ulang kata sandi Anda:
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetUrl}" style="background-color: #f4511e; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Reset Kata Sandi Sekarang
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
                Tautan ini berlaku selama <strong>15 menit</strong>. Jika Anda tidak meminta reset kata sandi ini, abaikan email ini dan akun Anda tetap aman.
              </p>
              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
                Atau salin tautan berikut ke browser Anda:<br/>
                <a href="${resetUrl}" style="color: #f4511e; word-break: break-all;">${resetUrl}</a>
              </div>
            </div>
            <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
              © ${new Date().getFullYear()} PT Berkah Alam Semesta. Hub Dispatch Hauling Gresik.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log(`[EMAIL DISPATCH] Email reset kata sandi berhasil dikirim ke ${user.email}`);
    } catch (mailErr) {
      console.error('[EMAIL DISPATCH ERROR]', mailErr.message);
      emailNotice = 'Gagal mengirim email via SMTP Gmail (cek konfigurasi credential). Tautan dev telah digenerate.';
    }
  } else {
    console.log(`[EMAIL DEV LINK] SMTP Gmail belum dikonfigurasi. Tautan reset untuk ${user.email}:\n${resetUrl}`);
    emailNotice = 'Mode development/testing aktif. Tautan reset URL telah tersedia.';
  }

  res.json({
    success: true,
    message: emailSent
      ? `Tautan reset kata sandi telah dikirimkan ke Gmail Anda (${user.email}). Silakan periksa kotak masuk atau folder spam.`
      : `Permintaan reset kata sandi diproses untuk ${user.email}. Tautan reset telah digenerate.`,
    emailSent,
    emailNotice,
    resetUrl,
    expiresInMinutes: 15,
  });
});

// Verify reset token validity
app.get('/api/auth/verify-reset-token', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token reset tidak ditemukan.' });
  }

  const now = Date.now();
  const user = db.prepare('SELECT id, name, email, reset_token_expires FROM users WHERE reset_token = ?').get(token);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Tautan reset kata sandi tidak valid atau telah digunakan.',
    });
  }

  if (user.reset_token_expires && user.reset_token_expires < now) {
    return res.status(400).json({
      success: false,
      message: 'Tautan reset kata sandi telah kedaluwarsa (melebihi 15 menit). Silakan ajukan permohonan reset ulang.',
    });
  }

  res.json({
    success: true,
    email: user.email,
    name: user.name,
  });
});

// Reset password with verified token
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token dan kata sandi baru wajib disertakan.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
  }

  const now = Date.now();
  const user = db.prepare('SELECT id, name, email, reset_token_expires FROM users WHERE reset_token = ?').get(token);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Tautan reset kata sandi tidak valid atau telah digunakan.',
    });
  }

  if (user.reset_token_expires && user.reset_token_expires < now) {
    return res.status(400).json({
      success: false,
      message: 'Tautan reset kata sandi telah kedaluwarsa. Silakan ajukan permohonan reset ulang.',
    });
  }

  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(
    newPassword,
    user.id
  );

  res.json({
    success: true,
    message: 'Kata sandi akun Anda berhasil diubah! Silakan login menggunakan kata sandi baru Anda.',
  });
});

// ==========================================
// USER MANAGEMENT & PROFILE ROUTES
// ==========================================

// Update user profile (Super Admin / Admin self-profile)
app.put('/api/users/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, birth_date, gender, avatar } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  if (avatar !== undefined) {
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, birth_date = ?, gender = ?, avatar = ?
      WHERE id = ?
    `).run(name.trim(), phone || '-', birth_date || null, gender || 'Laki-laki', avatar || null, id);
  } else {
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, birth_date = ?, gender = ?
      WHERE id = ?
    `).run(name.trim(), phone || '-', birth_date || null, gender || 'Laki-laki', id);
  }

  const updatedUser = db
    .prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, avatar, aktif, created_at FROM users WHERE id = ?')
    .get(id);

  res.json({
    success: true,
    message: 'Profil akun berhasil diperbarui.',
    user: updatedUser,
  });
});

// Update user avatar (Profile Photo)
app.put('/api/users/avatar/:id', (req, res) => {
  const { id } = req.params;
  const { avatar } = req.body;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar || null, id);

  const updatedUser = db
    .prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, avatar, aktif, created_at FROM users WHERE id = ?')
    .get(id);

  res.json({
    success: true,
    message: avatar ? 'Foto profil akun berhasil diperbarui.' : 'Foto profil akun berhasil dihapus.',
    user: updatedUser,
  });
});

// Change password for logged-in user
app.put('/api/users/change-password/:id', (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Kata sandi lama dan kata sandi baru wajib diisi.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
  }

  const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  if (user.password !== oldPassword) {
    return res.status(400).json({ success: false, message: 'Kata sandi lama yang Anda masukkan tidak sesuai.' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, id);

  res.json({
    success: true,
    message: 'Kata sandi akun Anda berhasil diperbarui.',
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, avatar, aktif, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Admin reset/change password for any user (Super Admin authority without needing old password)
app.put('/api/users/:id/admin-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
  }

  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword.trim(), id);

  res.json({
    success: true,
    message: `Kata sandi untuk pengguna ${user.name} berhasil diperbarui!`,
  });
});

// Admin update user details (name, email, role, branch, phone, birth_date, gender, aktif)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, roleLabel, branch, phone, birth_date, gender, aktif } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
  }

  const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  // Prevent demoting main superadmin
  let finalRole = role;
  let finalRoleLabel = roleLabel;
  if (user.id === 'usr-1' || user.email === 'superadmin@ptbas.co.id') {
    finalRole = 'superadmin';
    finalRoleLabel = 'Super Admin';
  } else {
    finalRole = role === 'superadmin' ? 'superadmin' : 'admin';
    finalRoleLabel = finalRole === 'superadmin' ? 'Super Admin' : 'Admin';
  }

  // Check unique email
  if (email && email.trim().toLowerCase() !== user.email?.toLowerCase()) {
    const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(email.trim().toLowerCase(), id);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: `Email ${email} sudah digunakan oleh pengguna lain.` });
    }
  }

  const finalAktif = (user.id === 'usr-1' || user.email === 'superadmin@ptbas.co.id') ? 1 : (aktif !== undefined ? (aktif ? 1 : 0) : 1);

  db.prepare(`
    UPDATE users
    SET name = ?, email = COALESCE(?, email), role = ?, roleLabel = ?, branch = ?, phone = ?, birth_date = ?, gender = ?, aktif = ?
    WHERE id = ?
  `).run(
    name.trim(),
    email ? email.trim().toLowerCase() : null,
    finalRole,
    finalRoleLabel,
    branch || 'Hub Gresik',
    phone || '-',
    birth_date || null,
    gender || 'Laki-laki',
    finalAktif,
    id
  );

  const updatedUser = db.prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at FROM users WHERE id = ?').get(id);

  res.json({
    success: true,
    message: `Data pengguna ${updatedUser.name} berhasil diperbarui.`,
    user: updatedUser,
  });
});

// Admin create new user directly
app.post('/api/users', (req, res) => {
  const { name, email, password, role, branch, phone, birth_date, gender } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, message: `Email ${cleanEmail} sudah terdaftar.` });
  }

  const id = `usr-${Date.now()}`;
  const cleanRole = role === 'superadmin' ? 'superadmin' : 'admin';
  const roleLabel = cleanRole === 'superadmin' ? 'Super Admin' : 'Admin';
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    name.trim(),
    cleanEmail,
    password,
    cleanRole,
    roleLabel,
    branch || 'Hub Gresik',
    phone || '-',
    birth_date || null,
    gender || 'Laki-laki',
    createdAt
  );

  const newUser = db.prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at FROM users WHERE id = ?').get(id);

  res.json({
    success: true,
    message: `Pengguna ${newUser.name} berhasil dibuat!`,
    user: newUser,
  });
});

// Approve user (Super Admin approval)
app.put('/api/users/:id/approve', (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, name, email, role, aktif FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  db.prepare('UPDATE users SET aktif = 1 WHERE id = ?').run(id);
  res.json({ success: true, message: `Akun ${user.name} berhasil disetujui dan aktif!` });
});

// Toggle user active status
app.put('/api/users/:id/toggle-status', (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, name, role, aktif FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  // Prevent disabling main superadmin
  if (user.role === 'superadmin') {
    return res.status(400).json({ success: false, message: 'Akun Super Admin utama tidak dapat dinonaktifkan.' });
  }

  const newStatus = user.aktif ? 0 : 1;
  db.prepare('UPDATE users SET aktif = ? WHERE id = ?').run(newStatus, id);
  res.json({ success: true, aktif: newStatus });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }
  if (user.id === 'usr-1' || user.email?.toLowerCase() === 'superadmin@ptbas.co.id') {
    return res.status(400).json({ success: false, message: 'Akun Super Admin utama (root) tidak dapat dihapus.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
});

// ==========================================
// MASTER DATA ROUTES
// ==========================================

// 1. Materials
app.get('/api/master/materials', (req, res) => {
  const { item_type, itemType } = req.query;
  const filterType = (item_type || itemType || '').toUpperCase();
  let query = 'SELECT * FROM materials';
  if (filterType === 'JASA_ANGKUT') {
    query += " WHERE UPPER(COALESCE(itemType, '')) = 'JASA_ANGKUT' OR category = 'Jasa' OR UPPER(name) LIKE '%JASA ANGKUT%'";
  } else if (filterType === 'MATERIAL') {
    query += " WHERE (UPPER(COALESCE(itemType, 'MATERIAL')) = 'MATERIAL') AND category != 'Jasa' AND UPPER(name) NOT LIKE '%JASA ANGKUT%'";
  }
  query += ' ORDER BY name ASC';
  const materials = db.prepare(query).all();
  res.json(materials);
});

app.post('/api/master/materials', (req, res) => {
  const { name, category = 'Curah', pphRate = 2.0, defaultUnit = 'm3', beli, jual, coa, coaPiutang, coaPendapatan } = req.body;
  const id = `mat-${Date.now()}`;

  db.prepare(`
    INSERT INTO materials (id, name, category, pphRate, defaultUnit, beli, jual, coa, coaPiutang, coaPendapatan, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, category, pphRate, defaultUnit, beli, jual, coa, coaPiutang, coaPendapatan);

  res.status(201).json({ success: true, id });
});

app.put('/api/master/materials/:id', (req, res) => {
  const { id } = req.params;
  const { name, category = 'Curah', pphRate = 2.0, defaultUnit = 'm3', beli, jual, coa, coaPiutang, coaPendapatan, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM materials WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Material not found' });

  db.prepare(`
    UPDATE materials
    SET name = ?, category = ?, pphRate = ?, defaultUnit = ?, beli = ?, jual = ?, coa = ?, coaPiutang = ?, coaPendapatan = ?, aktif = ?
    WHERE id = ?
  `).run(name, category, pphRate, defaultUnit, beli, jual, coa, coaPiutang, coaPendapatan, aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/materials/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM materials WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Material not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE materials SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/materials/:id', (req, res) => {
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 2. Suppliers
app.get('/api/master/suppliers', (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  res.json(suppliers);
});

app.post('/api/master/suppliers', (req, res) => {
  const { name, idProgram, penerima, telepon, pkp = 1, bank = 'BCA', noRekening, rekeningAtasNama } = req.body;
  const id = `sup-${Date.now()}`;

  db.prepare(`
    INSERT INTO suppliers (id, name, idProgram, penerima, telepon, pkp, bank, noRekening, rekeningAtasNama, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, idProgram, penerima, telepon, pkp ? 1 : 0, bank, noRekening, rekeningAtasNama);

  res.status(201).json({ success: true, id });
});

app.put('/api/master/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const { name, idProgram, penerima, telepon, pkp = 1, bank = 'BCA', noRekening, rekeningAtasNama, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM suppliers WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Supplier not found' });

  db.prepare(`
    UPDATE suppliers
    SET name = ?, idProgram = ?, penerima = ?, telepon = ?, pkp = ?, bank = ?, noRekening = ?, rekeningAtasNama = ?, aktif = ?
    WHERE id = ?
  `).run(name, idProgram, penerima, telepon, pkp ? 1 : 0, bank, noRekening, rekeningAtasNama, aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/suppliers/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM suppliers WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Supplier not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE suppliers SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/suppliers/:id', (req, res) => {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 3. Customers
app.get('/api/master/customers', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  res.json(customers);
});

app.post('/api/master/customers', (req, res) => {
  const { name, alias, badanUsaha = 'PT', alamat, npwp, telepon, kodePrefix } = req.body;
  const id = `cust-${Date.now()}`;

  db.prepare(`
    INSERT INTO customers (id, name, alias, badanUsaha, alamat, npwp, telepon, kodePrefix, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, alias, badanUsaha, alamat, npwp, telepon, kodePrefix);

  res.status(201).json({ success: true, id });
});

app.put('/api/master/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, alias, badanUsaha = 'PT', alamat, npwp, telepon, kodePrefix, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM customers WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Customer not found' });

  db.prepare(`
    UPDATE customers
    SET name = ?, alias = ?, badanUsaha = ?, alamat = ?, npwp = ?, telepon = ?, kodePrefix = ?, aktif = ?
    WHERE id = ?
  `).run(name, alias, badanUsaha, alamat, npwp, telepon, kodePrefix, aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/customers/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM customers WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Customer not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE customers SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 4. Armada
app.get('/api/master/armada', (req, res) => {
  const armada = db.prepare('SELECT * FROM armada ORDER BY nopol ASC').all();
  res.json(armada);
});

app.post('/api/master/armada', (req, res) => {
  const { nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun } = req.body;
  const id = `arm-${Date.now()}`;

  db.prepare(`
    INSERT INTO armada (id, nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun);

  res.status(201).json({ success: true, id });
});

app.put('/api/master/armada/:id', (req, res) => {
  const { id } = req.params;
  const { nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM armada WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Armada not found' });

  db.prepare(`
    UPDATE armada
    SET nopol = ?, panjangCm = ?, lebarCm = ?, tinggiCm = ?, merk = ?, vin = ?, mesin = ?, tahun = ?, aktif = ?
    WHERE id = ?
  `).run(nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun, aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/armada/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM armada WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Armada not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE armada SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/armada/:id', (req, res) => {
  db.prepare('DELETE FROM armada WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 5. Banks
app.get('/api/master/banks', (req, res) => {
  const banks = db.prepare('SELECT * FROM banks ORDER BY id ASC').all();
  res.json(banks);
});

app.post('/api/master/banks', (req, res) => {
  const { namaBank, namaAlias, kodeSwift, kodeBank } = req.body;
  const id = `bank-${Date.now()}`;

  db.prepare(`
    INSERT INTO banks (id, namaBank, namaAlias, kodeSwift, kodeBank, aktif)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, namaBank, namaAlias || namaBank, kodeSwift || '', kodeBank || '');

  res.status(201).json({ success: true, id });
});

app.put('/api/master/banks/:id', (req, res) => {
  const { id } = req.params;
  const { namaBank, namaAlias, kodeSwift, kodeBank, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM banks WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Bank not found' });

  db.prepare(`
    UPDATE banks
    SET namaBank = ?, namaAlias = ?, kodeSwift = ?, kodeBank = ?, aktif = ?
    WHERE id = ?
  `).run(namaBank, namaAlias || namaBank, kodeSwift || '', kodeBank || '', aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/banks/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM banks WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Bank not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE banks SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/banks/:id', (req, res) => {
  db.prepare('DELETE FROM banks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 6. Bank Accounts (Rekening)
app.get('/api/master/bank-accounts', (req, res) => {
  const accounts = db.prepare('SELECT * FROM bank_accounts ORDER BY id ASC').all();
  res.json(accounts);
});

app.post('/api/master/bank-accounts', (req, res) => {
  const { bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, supplierId } = req.body;
  const id = `acc-${Date.now()}`;

  db.prepare(`
    INSERT INTO bank_accounts (id, bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, supplierId, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, bank, jenisRekening || 'Giro Operasional', nomorRekening, rekeningAtasNama, namaAlias || '', supplierId || null);

  res.status(201).json({ success: true, id });
});

app.put('/api/master/bank-accounts/:id', (req, res) => {
  const { id } = req.params;
  const { bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, supplierId, aktif } = req.body;
  const current = db.prepare('SELECT id, aktif FROM bank_accounts WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Bank account not found' });

  db.prepare(`
    UPDATE bank_accounts
    SET bank = ?, jenisRekening = ?, nomorRekening = ?, rekeningAtasNama = ?, namaAlias = ?, supplierId = ?, aktif = ?
    WHERE id = ?
  `).run(bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, supplierId || null, aktif !== undefined ? (aktif ? 1 : 0) : current.aktif, id);

  res.json({ success: true });
});

app.patch('/api/master/bank-accounts/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT aktif FROM bank_accounts WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Bank account not found' });

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE bank_accounts SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/bank-accounts/:id', (req, res) => {
  db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 7. Currencies (Mata Uang)
app.get('/api/master/currencies', (req, res) => {
  const currencies = db.prepare('SELECT * FROM currencies ORDER BY isBase DESC, id ASC').all();
  // Parse lingkupModul JSON string to array
  const formatted = currencies.map((c) => ({
    ...c,
    isBase: Boolean(c.isBase),
    aktif: Boolean(c.aktif),
    lingkupModul: (() => {
      try {
        return c.lingkupModul ? JSON.parse(c.lingkupModul) : [];
      } catch {
        return [];
      }
    })(),
  }));
  res.json(formatted);
});

app.post('/api/master/currencies', (req, res) => {
  const { code, isoCode, name, englishName, symbol, country, pemisahRibuan, pemisahDesimal, formatSample, presisi, formatPresisi, pajak, isBase, deskripsi, lingkupModul } = req.body;
  const id = `curr-${code.toLowerCase()}`;

  db.prepare(`
    INSERT INTO currencies (id, code, isoCode, name, englishName, symbol, country, pemisahRibuan, pemisahDesimal, formatSample, presisi, formatPresisi, pajak, isBase, deskripsi, lingkupModul, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    code.toUpperCase(),
    isoCode || '',
    name,
    englishName || '',
    symbol || '',
    country || '',
    pemisahRibuan || 'Titik (.)',
    pemisahDesimal || 'Koma (,)',
    formatSample || '',
    presisi || '2 Digit Desimal',
    formatPresisi || '',
    pajak || 'Non-PPN',
    isBase ? 1 : 0,
    deskripsi || '',
    JSON.stringify(Array.isArray(lingkupModul) ? lingkupModul : [])
  );

  res.status(201).json({ success: true, id });
});

app.put('/api/master/currencies/:id', (req, res) => {
  const { id } = req.params;
  const { code, isoCode, name, englishName, symbol, country, pemisahRibuan, pemisahDesimal, formatSample, presisi, formatPresisi, pajak, isBase, deskripsi, lingkupModul, aktif } = req.body;
  const current = db.prepare('SELECT id, isBase, aktif FROM currencies WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Currency not found' });

  db.prepare(`
    UPDATE currencies
    SET code = ?, isoCode = ?, name = ?, englishName = ?, symbol = ?, country = ?, pemisahRibuan = ?, pemisahDesimal = ?, formatSample = ?, presisi = ?, formatPresisi = ?, pajak = ?, isBase = ?, deskripsi = ?, lingkupModul = ?, aktif = ?
    WHERE id = ?
  `).run(
    code.toUpperCase(),
    isoCode || '',
    name,
    englishName || '',
    symbol || '',
    country || '',
    pemisahRibuan || 'Titik (.)',
    pemisahDesimal || 'Koma (,)',
    formatSample || '',
    presisi || '2 Digit Desimal',
    formatPresisi || '',
    pajak || 'Non-PPN',
    isBase !== undefined ? (isBase ? 1 : 0) : current.isBase,
    deskripsi || '',
    JSON.stringify(Array.isArray(lingkupModul) ? lingkupModul : []),
    aktif !== undefined ? (aktif ? 1 : 0) : current.aktif,
    id
  );

  res.json({ success: true });
});

app.patch('/api/master/currencies/:id/toggle', (req, res) => {
  const { id } = req.params;
  const current = db.prepare('SELECT isBase, aktif FROM currencies WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ message: 'Currency not found' });

  // Prevent disabling base currency
  if (current.isBase) {
    return res.status(400).json({
      success: false,
      message: 'Mata uang basis (IDR) acuan buku besar tidak dapat dinonaktifkan.',
    });
  }

  const nextState = current.aktif ? 0 : 1;
  db.prepare('UPDATE currencies SET aktif = ? WHERE id = ?').run(nextState, id);
  res.json({ success: true, aktif: nextState });
});

app.delete('/api/master/currencies/:id', (req, res) => {
  const current = db.prepare('SELECT isBase FROM currencies WHERE id = ?').get(req.params.id);
  if (current && current.isBase) {
    return res.status(400).json({ success: false, message: 'Mata uang basis tidak dapat dihapus.' });
  }
  db.prepare('DELETE FROM currencies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// TRANSACTIONS ROUTES
// ==========================================

// Pre Orders
app.get('/api/pre-orders', (req, res) => {
  const pos = db.prepare('SELECT * FROM pre_orders ORDER BY tanggal DESC, id DESC').all();
  const parsed = pos.map((po) => {
    let items = po.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }
    return {
      ...po,
      items: Array.isArray(items) ? items : [],
    };
  });
  res.json(parsed);
});

app.post('/api/pre-orders', (req, res) => {
  try {
    const b = req.body || {};
    const jenisRO = normalizeRoType(b.jenisRO || 'JASA ANGKUT + MATERIAL');

    // Parse incoming items
    let rawItems = [];
    if (typeof b.items === 'string') {
      try { rawItems = JSON.parse(b.items); } catch (e) { rawItems = []; }
    } else if (Array.isArray(b.items)) {
      rawItems = b.items;
    }

    // 1. Strict validation based on jenisRO (aligned with centralized roRules)
    if (jenisRO === RO_TYPES.MATERIAL_SAJA) {
      const hasJasa = rawItems.some((it) => getItemType(it) === ITEM_TYPES.JASA_ANGKUT);
      if (hasJasa) {
        return res.status(422).json({
          success: false,
          message: 'Item Jasa Angkut tidak diizinkan pada RO jenis Material Saja',
        });
      }
    } else if (jenisRO === RO_TYPES.JASA_ANGKUT_SAJA) {
      const hasMaterial = rawItems.some((it) => getItemType(it) === ITEM_TYPES.MATERIAL);
      if (hasMaterial) {
        return res.status(422).json({
          success: false,
          message: 'Item Material tidak diizinkan pada RO jenis Jasa Angkut Saja',
        });
      }
    } else if (jenisRO === RO_TYPES.JASA_ANGKUT_MATERIAL) {
      const manualItems = rawItems.filter((it) => !it.isAutoGenerated);
      if (manualItems.length === 0) {
        return res.status(422).json({
          success: false,
          message: 'Harus memilih minimal 1 item Material pada jenis Jasa Angkut + Material',
        });
      }
      const invalidManual = manualItems.some((it) => getItemType(it) !== ITEM_TYPES.MATERIAL);
      if (invalidManual) {
        return res.status(422).json({
          success: false,
          message: 'Hanya item Material yang boleh dipilih pada RO jenis Jasa Angkut + Material',
        });
      }
    }

    // 2. Guarantee auto-generated Jasa Angkut for JASA ANGKUT + MATERIAL in database
    let finalizedItems = [...rawItems];
    if (jenisRO === RO_TYPES.JASA_ANGKUT_MATERIAL) {
      const allDbMats = db.prepare('SELECT * FROM materials').all();
      finalizedItems = [];
      const matItems = rawItems.filter((it) => !it.isAutoGenerated && getItemType(it) === ITEM_TYPES.MATERIAL);

      for (const mat of matItems) {
        const matId = mat.id || `item-mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const sanitizedMat = {
          ...mat,
          id: matId,
          itemType: ITEM_TYPES.MATERIAL,
          isAutoGenerated: false,
        };
        finalizedItems.push(sanitizedMat);

        // Check if paired auto-generated Jasa Angkut exists in rawItems
        const existingJa = rawItems.find((it) => it.isAutoGenerated && (it.parentItemId === mat.id || it.parentItemId === matId));
        if (existingJa) {
          finalizedItems.push({
            ...existingJa,
            parentItemId: matId,
            kuantitas: mat.kuantitas || 0,
            satuan: '',
            itemType: ITEM_TYPES.JASA_ANGKUT,
            isAutoGenerated: true,
          });
        } else {
          // Find corresponding Jasa Angkut in materials catalog
          const targetJa =
            allDbMats.find((m) => getItemType(m) === ITEM_TYPES.JASA_ANGKUT && m.materialId === mat.materialId) ||
            allDbMats.find((m) => getItemType(m) === ITEM_TYPES.JASA_ANGKUT) || {
              id: 'mat-3-generic',
              name: 'JASA ANGKUT',
              category: 'Jasa',
              satuan: '',
              beli: 0,
              jual: 0,
              pphRate: 2.0,
            };

          const autoJaId = `auto-ja-${matId}`;
          const autoJa = {
            id: autoJaId,
            parentItemId: matId,
            isAutoGenerated: true,
            itemType: ITEM_TYPES.JASA_ANGKUT,
            materialId: targetJa.id,
            nama: targetJa.name || 'JASA ANGKUT',
            category: targetJa.category || 'Jasa',
            satuan: '',
            kuantitas: mat.kuantitas || 0,
            hargaBeli: Number(targetJa.beli || 0),
            hargaJual: Number(targetJa.jual || 0),
            pphRate: Number(targetJa.pphRate || 2.0),
          };
          finalizedItems.push(autoJa);
        }
      }
    }

    const id = (b.id && !isNaN(Number(b.id))) ? Number(b.id) : Date.now();
    const finalNomorRO = b.nomorRO || generateNomorRO(b.customer, b.tanggal ? new Date(b.tanggal) : new Date());
    const itemsJson = JSON.stringify(finalizedItems);

    const firstItem = finalizedItems[0] || {};
    const firstMaterial = finalizedItems.find((it) => getItemType(it) === ITEM_TYPES.MATERIAL) || firstItem;

    const cleanPoCustomer = (b.nomorPoCustomer && String(b.nomorPoCustomer).trim() !== '') ? String(b.nomorPoCustomer).trim().slice(0, 50) : null;
    const cleanPo = (b.nomorPo && String(b.nomorPo).trim() !== '' && b.nomorPo !== 'MENUNGGU SURAT JALAN PERTAMA') ? String(b.nomorPo).trim().slice(0, 50) : null;
    const resolvedPoNumber = cleanPo || cleanPoCustomer || null;
    const custRow = db.prepare('SELECT id, alamat FROM customers WHERE name = ? OR alias = ? LIMIT 1').get(b.customer, b.customer);
    const customerId = b.customerId || custRow?.id || null;
    const customerAddress = b.customerAddress || custRow?.alamat || '';

    const params = [
      id,
      resolvedPoNumber,
      b.customer ?? '',
      customerAddress,
      firstMaterial.materialId ?? b.materialId ?? '',
      firstMaterial.nama ?? b.materialName ?? '',
      firstMaterial.category ?? b.materialCategory ?? 'Curah',
      Number(firstMaterial.pphRate ?? b.pphRate) || 0,
      firstMaterial.satuan ?? b.satuan ?? 'm3',
      Number(b.totalOrder) || 0,
      Number(b.terkirim) || 0,
      Number(firstMaterial.hargaJual ?? b.hargaJual) || 0,
      Number(firstMaterial.hargaBeli ?? b.hargaBeli) || 0,
      b.tanggal ?? new Date().toISOString().split('T')[0],
      b.top ?? '30 Hari',
      b.status ?? 'MENUNGGU_APPROVAL',
      b.createdBy ?? 'Admin Gresik',
      b.approvedBy ?? null,
      b.approvedAt ?? null,
      b.rejectionReason ?? null,
      itemsJson,
      finalNomorRO,
      jenisRO,
      b.jenis ?? 'CURAH',
      b.mataUang ?? 'IDR',
      b.jenisWajibPajak ?? 'PKP',
      cleanPoCustomer,
      b.hubungkanNomorPoMaterial ? String(b.hubungkanNomorPoMaterial).trim().slice(0, 50) : null,
      b.satuanJasaAngkut ?? b.satuan ?? 'm³',
      customerId,
    ].map((val) => (val === undefined ? null : val));

    db.prepare(`
      INSERT OR REPLACE INTO pre_orders (
        id, nomorPo, customer, customerAddress, materialId, materialName,
        materialCategory, pphRate, satuan, totalOrder, terkirim, hargaJual,
        hargaBeli, tanggal, top, status, createdBy, approvedBy, approvedAt,
        rejectionReason, items, nomorRO, jenisRO, jenis, mataUang,
        jenisWajibPajak, nomorPoCustomer, hubungkanNomorPoMaterial, satuanJasaAngkut, customerId
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `).run(...params);

    const created = {
      id,
      nomorPo: resolvedPoNumber,
      customer: b.customer ?? '',
      customerAddress,
      customerId,
      materialId: firstMaterial.materialId ?? b.materialId ?? '',
      materialName: firstMaterial.nama ?? b.materialName ?? '',
      materialCategory: firstMaterial.category ?? b.materialCategory ?? 'Curah',
      pphRate: Number(firstMaterial.pphRate ?? b.pphRate) || 0,
      satuan: firstMaterial.satuan ?? b.satuan ?? 'm3',
      totalOrder: Number(b.totalOrder) || 0,
      terkirim: Number(b.terkirim) || 0,
      hargaJual: Number(firstMaterial.hargaJual ?? b.hargaJual) || 0,
      hargaBeli: Number(firstMaterial.hargaBeli ?? b.hargaBeli) || 0,
      tanggal: b.tanggal ?? new Date().toISOString().split('T')[0],
      top: b.top ?? '30 Hari',
      status: b.status ?? 'MENUNGGU_APPROVAL',
      createdBy: b.createdBy ?? 'Admin Gresik',
      approvedBy: b.approvedBy ?? null,
      approvedAt: b.approvedAt ?? null,
      rejectionReason: b.rejectionReason ?? null,
      items: finalizedItems,
      nomorRO: finalNomorRO,
      jenisRO,
      jenis: b.jenis ?? 'CURAH',
      mataUang: b.mataUang ?? 'IDR',
      jenisWajibPajak: b.jenisWajibPajak ?? 'PKP',
      nomorPoCustomer: b.nomorPoCustomer ?? '',
      hubungkanNomorPoMaterial: b.hubungkanNomorPoMaterial ?? '',
      satuanJasaAngkut: b.satuanJasaAngkut ?? b.satuan ?? 'm³',
    };

    res.status(201).json({ success: true, id, data: created });
  } catch (err) {
    console.error('Error inserting pre_order:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/pre-orders/:id/approve', (req, res) => {
  const { approver = 'David Rusiah (Direktur)' } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  db.prepare(`
    UPDATE pre_orders
    SET status = 'APPROVED', approvedBy = ?, approvedAt = ?, rejectionReason = NULL
    WHERE id = ?
  `).run(approver, now, req.params.id);

  const po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(req.params.id);
  if (!po) {
    return res.status(404).json({ success: false, message: 'Pre Order tidak ditemukan' });
  }

  let parsedItems = [];
  if (po.items) {
    try { parsedItems = JSON.parse(po.items); } catch (e) { parsedItems = []; }
  }

  // Pastikan Pre Order memiliki nomor RO resmi
  let finalNomorRO = po.nomorRO;
  if (!finalNomorRO) {
    finalNomorRO = generateNomorRO(po.customer, po.tanggal ? new Date(po.tanggal) : new Date());
    db.prepare('UPDATE pre_orders SET nomorRO = ? WHERE id = ?').run(finalNomorRO, po.id);
    po.nomorRO = finalNomorRO;
  }

  // Otomatis buat Jurnal GI (Ringkasan Jurnal) untuk nomor RO pre-order ini jika belum ada
  let existingJurnal = db.prepare('SELECT * FROM jurnal_gi WHERE preOrderId = ? OR nomorRO = ?').get(po.id, finalNomorRO);
  
  let jurnalId = existingJurnal?.id;
  if (!existingJurnal) {
    jurnalId = `REK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;
    const firstItem = parsedItems[0] || {};
    const matName = po.materialName || firstItem.nama || 'SIRTU';
    const targetVol = Number(po.totalOrder || firstItem.kuantitas || 0);
    const hBeli = Number(po.hargaBeli || firstItem.hargaBeli || 0);
    const hJual = Number(po.hargaJual || firstItem.hargaJual || 0);
    const isPpn = po.jenisWajibPajak === 'PKP' ? 1 : 0;
    const targetTrips = po.satuan === 'rit' ? Math.max(1, targetVol) : 0;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO jurnal_gi (
        id, nomorRO, preOrderId, poNumber, customer, customerAddress,
        material, isPpn, tanggal, totalSj, targetRitase, totalVolume,
        targetVolume, satuan, hargaBeli, hargaJual, nominalBeli,
        nominalJual, status, suratJalanDetails, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jurnalId,
      finalNomorRO,
      po.id,
      po.nomorPo || 'MENUNGGU SURAT JALAN PERTAMA',
      po.customer,
      po.customerAddress || '',
      matName,
      isPpn,
      po.tanggal || nowIso.split('T')[0],
      0,
      targetTrips,
      0,
      targetVol,
      po.satuan || 'm3',
      hBeli,
      hJual,
      0,
      0,
      'Siap Kirim',
      JSON.stringify([]),
      nowIso,
      nowIso
    );
    existingJurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(jurnalId);
  }

  let sjDetails = [];
  if (existingJurnal?.suratJalanDetails) {
    try {
      sjDetails = typeof existingJurnal.suratJalanDetails === 'string'
        ? JSON.parse(existingJurnal.suratJalanDetails)
        : (existingJurnal.suratJalanDetails || []);
    } catch (e) {
      sjDetails = [];
    }
  }

  try {
    syncBkkAndInvoices();
  } catch (e) {}

  res.json({
    success: true,
    data: { ...po, nomorRO: finalNomorRO, items: parsedItems },
    jurnalId,
    jurnal: existingJurnal ? { ...existingJurnal, suratJalanDetails: sjDetails } : null,
    message: `Pre Order ${finalNomorRO} disetujui dan Ringkasan Jurnal (Jurnal GI) otomatis dibuat.`
  });
});

app.patch('/api/pre-orders/:id/reject', (req, res) => {
  const { reason = 'Margin di bawah batas minimum' } = req.body;
  db.prepare(`
    UPDATE pre_orders
    SET status = 'REJECTED', rejectionReason = ?
    WHERE id = ?
  `).run(reason, req.params.id);

  const updated = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(req.params.id);
  if (updated && updated.items) {
    try { updated.items = JSON.parse(updated.items); } catch (e) { updated.items = []; }
  }
  res.json({ success: true, data: updated });
});

// Update Nomor PO Customer secara independen (Option B: tanpa perlu approval ulang Superadmin)
app.patch('/api/pre-orders/:id/customer-po', (req, res) => {
  try {
    const { id } = req.params;
    const { poNumber, syncWaybills = true, updatedBy = 'Admin' } = req.body;

    const po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Received Order tidak ditemukan' });
    }

    const cleanPo = (poNumber && String(poNumber).trim() !== '')
      ? String(poNumber).trim().slice(0, 50)
      : null;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Update received_order
    db.prepare(`
      UPDATE received_order
      SET nomorPo = ?, nomorPoCustomer = ?, poUpdatedBy = ?, poUpdatedAt = ?
      WHERE id = ?
    `).run(cleanPo, cleanPo, updatedBy, now, id);

    let syncedSjCount = 0;
    let syncedJurnalCount = 0;
    let syncedInvoiceCount = 0;
    let syncedBkkCount = 0;

    if (syncWaybills) {
      const roNum = po.nomorRO || '';

      // Update Surat Jalan terkait
      const sjResult = db.prepare(`
        UPDATE surat_jalan
        SET poNumber = ?
        WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)
      `).run(cleanPo, id, roNum);
      syncedSjCount = sjResult.changes || 0;

      // Update Jurnal GI
      const jurnalResult = db.prepare(`
        UPDATE jurnal_gi
        SET poNumber = ?
        WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)
      `).run(cleanPo, id, roNum);
      syncedJurnalCount = jurnalResult.changes || 0;

      // Update Invoices
      const invResult = db.prepare(`
        UPDATE invoices
        SET poNumber = ?
        WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)
      `).run(cleanPo, id, roNum);
      syncedInvoiceCount = invResult.changes || 0;

      // Update BKK
      const bkkResult = db.prepare(`
        UPDATE bkk
        SET poNumber = ?
        WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)
      `).run(cleanPo, id, roNum);
      syncedBkkCount = bkkResult.changes || 0;
    }

    const updated = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(id);
    if (updated && updated.items) {
      try { updated.items = JSON.parse(updated.items); } catch (e) { updated.items = []; }
    }

    try {
      syncBkkAndInvoices();
    } catch (e) {}

    res.json({
      success: true,
      data: updated,
      syncedCount: {
        suratJalan: syncedSjCount,
        jurnal: syncedJurnalCount,
        invoices: syncedInvoiceCount,
        bkk: syncedBkkCount,
      },
      message: cleanPo
        ? `Nomor PO ${cleanPo} berhasil disimpan dan disinkronkan ke ${syncedSjCount} Surat Jalan.`
        : `Nomor PO berhasil dikosongkan pada RO dan ${syncedSjCount} Surat Jalan terkait.`
    });
  } catch (err) {
    console.error('Error updating customer PO:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Pre-Order and automatically cascade delete/clean any linked journals & waybills (Superadmin Only)
app.delete('/api/pre-orders/:id', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menghapus Received Order')) return;
  try {
    const { id } = req.params;
    const po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(id);
    if (!po) return res.status(404).json({ success: false, message: 'Pre Order not found' });

    db.prepare('DELETE FROM invoices WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').run(id, po.nomorRO || '');
    db.prepare('DELETE FROM bkk WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').run(id, po.nomorRO || '');
    db.prepare('DELETE FROM jurnal_gi WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').run(id, po.nomorRO || '');
    db.prepare('DELETE FROM surat_jalan WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').run(id, po.nomorRO || '');
    db.prepare('DELETE FROM pre_orders WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Pre Order ${po.nomorRO || id} beserta ringkasan jurnal dan surat jalan terkait berhasil dihapus.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// JURNAL GI / REKAPAN ROUTES
// ==========================================
app.get('/api/jurnal-gi', (req, res) => {
  const jurnals = db.prepare('SELECT * FROM jurnal_gi ORDER BY tanggal DESC, created_at DESC, id DESC').all();
  const formatted = jurnals.map((j) => {
    let details = [];
    try {
      details = typeof j.suratJalanDetails === 'string' ? JSON.parse(j.suratJalanDetails) : (j.suratJalanDetails || []);
    } catch (e) {
      details = [];
    }
    return {
      ...j,
      isPpn: Boolean(j.isPpn),
      totalSj: Number(j.totalSj || 0),
      totalVolume: Number(j.totalVolume || 0),
      targetVolume: Number(j.targetVolume || 0),
      targetRitase: Number(j.targetRitase || 0),
      hargaBeli: Number(j.hargaBeli || 0),
      hargaJual: Number(j.hargaJual || 0),
      nominalBeli: Number(j.nominalBeli || 0),
      nominalJual: Number(j.nominalJual || 0),
      suratJalanDetails: Array.isArray(details) ? details : [],
    };
  });
  res.json(formatted);
});

// Delete Jurnal GI / Rekapan (e.g. for orphan records or administrative reset)
app.delete('/api/jurnal-gi/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM jurnal_gi WHERE id = ?').run(id);
    res.json({ success: true, message: `Jurnal ${id} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Surat Jalan
app.get('/api/surat-jalan', (req, res) => {
  const sjs = db.prepare('SELECT * FROM surat_jalan ORDER BY id DESC').all();
  res.json(sjs);
});

app.post('/api/surat-jalan', (req, res) => {
  const {
    id: customId,
    poNumber,
    customer,
    material,
    nopol,
    nomorPolisi,
    driver,
    tanggal,
    waktu,
    nomorNota,
    isPpn,
    panjangCm,
    lebarCm,
    tinggiCm,
    koreksiTinggiCm = 0,
    volumeAkhir,
    status = 'Selesai',
    nomorRo,
    nomorRO,
    jurnalId,
    preOrderId,
  } = req.body;

  const finalNopol = nopol || nomorPolisi || 'W 9821 UB';
  const finalVolume = Number(volumeAkhir) || 0;
  const inputRo = nomorRO || nomorRo;

  // 1. Validasi PO Approval: Pre-Order HARUS sudah berstatus APPROVED
  let targetPo = null;
  if (preOrderId) {
    targetPo = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(preOrderId);
  }
  if (!targetPo && inputRo) {
    targetPo = db.prepare('SELECT * FROM pre_orders WHERE nomorRO = ?').get(inputRo);
  }
  if (!targetPo && poNumber) {
    targetPo = db.prepare('SELECT * FROM pre_orders WHERE nomorPo = ? OR id = ?').get(poNumber, poNumber);
  }
  if (!targetPo && customer) {
    targetPo = db.prepare("SELECT * FROM pre_orders WHERE customer = ? AND status = 'APPROVED' ORDER BY id DESC LIMIT 1").get(customer);
  }

  if (targetPo && targetPo.status !== 'APPROVED') {
    return res.status(400).json({
      success: false,
      message: `Surat Jalan ditolak: Pre Order ${targetPo.nomorRO || targetPo.id} untuk ${targetPo.customer} belum disetujui (APPROVED) oleh Super Admin!`
    });
  }

  const finalNomorRo = targetPo?.nomorRO || inputRo || generateNomorRO(customer, tanggal ? new Date(tanggal) : new Date());
  const id = customId || null;

  // Handle Optional PO Numbering (VARCHAR up to 50 chars)
  const isDraftOrId = (str) => {
    if (!str) return true;
    const s = String(str).trim();
    return s === '' || s === 'MENUNGGU SURAT JALAN PERTAMA' || s.startsWith('PO-DRAFT-') || /^\d{10,}$/.test(s);
  };

  let finalPoNum = null;
  if (!isDraftOrId(poNumber) && poNumber !== String(targetPo?.id)) {
    finalPoNum = String(poNumber).trim().slice(0, 50);
  } else if (targetPo?.nomorPo && !isDraftOrId(targetPo.nomorPo)) {
    finalPoNum = String(targetPo.nomorPo).trim().slice(0, 50);
  } else if (req.body?.autoGeneratePo) {
    finalPoNum = generatePoNumber(customer, tanggal ? new Date(tanggal) : new Date());
  }

  if (targetPo) {
    const newTerkirim = Number(((targetPo.terkirim || 0) + finalVolume).toFixed(2));
    db.prepare('UPDATE pre_orders SET terkirim = ?, nomorPo = ?, nomorRO = ? WHERE id = ?').run(
      newTerkirim,
      finalPoNum,
      finalNomorRo,
      targetPo.id
    );
  }

  // 2. CARI ATAU BUAT JURNAL GI (RINGKASAN JURNAL) TERKAIT
  let jurnal = null;
  if (jurnalId) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(jurnalId);
  }
  if (!jurnal && targetPo) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(targetPo.id, finalNomorRo);
  }
  if (!jurnal && inputRo) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE nomorRO = ?').get(inputRo);
  }
  if (!jurnal && finalPoNum && !finalPoNum.startsWith('PO-DRAFT-')) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE poNumber = ?').get(finalPoNum);
  }

  // Jika jurnal belum ada untuk PO ini, otomatis buat jurnal baru
  if (!jurnal) {
    const newJrnId = `REK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;
    const targetVol = targetPo ? Number(targetPo.totalOrder || 0) : finalVolume;
    const hBeli = targetPo ? Number(targetPo.hargaBeli || 0) : 40000;
    const hJual = targetPo ? Number(targetPo.hargaJual || 0) : 50000;
    const isPpnFlag = targetPo ? (targetPo.jenisWajibPajak === 'PKP' ? 1 : 0) : (isPpn ? 1 : 0);
    const targetTrips = targetPo?.satuan === 'rit' ? Math.max(1, targetVol) : 0;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO jurnal_gi (
        id, nomorRO, preOrderId, poNumber, customer, customerAddress, material,
        isPpn, tanggal, totalSj, targetRitase, totalVolume, targetVolume, satuan,
        hargaBeli, hargaJual, nominalBeli, nominalJual, status, suratJalanDetails,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newJrnId,
      finalNomorRo,
      targetPo?.id || null,
      finalPoNum,
      customer,
      targetPo?.customerAddress || '',
      material,
      isPpnFlag,
      tanggal,
      0,
      targetTrips,
      0,
      targetVol,
      targetPo?.satuan || 'm3',
      hBeli,
      hJual,
      0,
      0,
      'Siap Kirim',
      JSON.stringify([]),
      nowIso,
      nowIso
    );
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(newJrnId);
  }

  // 3. Simpan Surat Jalan lengkap dengan relasi nomorRO, jurnalId, dan preOrderId
  let insertInfo;
  if (id && !isNaN(Number(id))) {
    insertInfo = db.prepare(`
      INSERT INTO surat_jalan (
        id, poNumber, nomorRO, jurnalId, preOrderId, customer,
        material, nopol, driver, tanggal, waktu, nomorNota, isPpn,
        panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(id),
      finalPoNum,
      jurnal.nomorRO || finalNomorRo,
      jurnal.id,
      targetPo?.id || preOrderId || null,
      customer,
      material,
      finalNopol,
      driver || 'Supir Armada Terjadwal',
      tanggal,
      waktu || '09:00',
      nomorNota || '',
      isPpn ? 1 : 0,
      panjangCm,
      lebarCm,
      tinggiCm,
      koreksiTinggiCm,
      finalVolume,
      status
    );
  } else {
    insertInfo = db.prepare(`
      INSERT INTO surat_jalan (
        poNumber, nomorRO, jurnalId, preOrderId, customer,
        material, nopol, driver, tanggal, waktu, nomorNota, isPpn,
        panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalPoNum,
      jurnal.nomorRO || finalNomorRo,
      jurnal.id,
      targetPo?.id || preOrderId || null,
      customer,
      material,
      finalNopol,
      driver || 'Supir Armada Terjadwal',
      tanggal,
      waktu || '09:00',
      nomorNota || '',
      isPpn ? 1 : 0,
      panjangCm,
      lebarCm,
      tinggiCm,
      koreksiTinggiCm,
      finalVolume,
      status
    );
  }

  const insertedRow = db.prepare('SELECT id FROM surat_jalan WHERE rowid = ?').get(insertInfo.lastInsertRowid);
  const newId = Number(insertedRow?.id || insertInfo.lastInsertRowid);

  // 4. Masukkan rincian/deskripsi Surat Jalan ke Jurnal Summary (jurnal_gi)
  let sjDetails = [];
  try {
    sjDetails = typeof jurnal.suratJalanDetails === 'string' ? JSON.parse(jurnal.suratJalanDetails) : (jurnal.suratJalanDetails || []);
  } catch (e) {
    sjDetails = [];
  }

  const sjItemDesc = {
    id: newId,
    poNumber: finalPoNum,
    nomorRO: jurnal.nomorRO || finalNomorRo,
    jurnalId: jurnal.id,
    customer,
    material,
    nopol: finalNopol,
    driver: driver || 'Supir Armada Terjadwal',
    tanggal,
    waktu: waktu || '09:00',
    nomorNota: nomorNota || '',
    panjangCm: Number(panjangCm) || 0,
    lebarCm: Number(lebarCm) || 0,
    tinggiCm: Number(tinggiCm) || 0,
    koreksiTinggiCm: Number(koreksiTinggiCm) || 0,
    volumeAkhir: finalVolume,
    status: status || 'Selesai',
  };

  const filteredDetails = sjDetails.filter((d) => d.id !== newId);
  filteredDetails.push(sjItemDesc);

  const updatedTotalSj = filteredDetails.length;
  const updatedTotalVolume = Number(filteredDetails.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2));
  const updatedNominalBeli = Math.round(updatedTotalVolume * (Number(jurnal.hargaBeli) || 0));
  const updatedNominalJual = Math.round(updatedTotalVolume * (Number(jurnal.hargaJual) || 0));
  const targetVol = Number(jurnal.targetVolume) || 0;
  const isVolumeMet = targetVol > 0 && updatedTotalVolume >= targetVol;
  const newJurnalStatus = isVolumeMet ? 'Selesai Kirim' : 'Dalam Pengiriman';
  const nowIso = new Date().toISOString();

  db.prepare(`
    UPDATE jurnal_gi
    SET totalSj = ?, totalVolume = ?, nominalBeli = ?, nominalJual = ?,
        poNumber = ?, status = ?, suratJalanDetails = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updatedTotalSj,
    updatedTotalVolume,
    updatedNominalBeli,
    updatedNominalJual,
    finalPoNum,
    newJurnalStatus,
    JSON.stringify(filteredDetails),
    nowIso,
    jurnal.id
  );

  const updatedJurnal = {
    ...jurnal,
    totalSj: updatedTotalSj,
    totalVolume: updatedTotalVolume,
    nominalBeli: updatedNominalBeli,
    nominalJual: updatedNominalJual,
    status: newJurnalStatus,
    poNumber: finalPoNum,
    suratJalanDetails: filteredDetails,
    updated_at: nowIso,
  };

  try {
    syncBkkAndInvoices();
  } catch (e) {}

  res.status(201).json({
    success: true,
    id: newId,
    jurnalId: jurnal.id,
    data: sjItemDesc,
    jurnal: updatedJurnal,
    message: `Surat Jalan #${newId} berhasil disimpan dan otomatis masuk ke Ringkasan Jurnal ${jurnal.nomorRO}.`
  });
});

// ==========================================
// BKK (CASH OUT) ROUTES
// ==========================================
app.get('/api/bkk', (req, res) => {
  const bkks = db.prepare(`
    SELECT b.*,
           s.bank as supplierBank,
           s.noRekening as supplierNoRekening,
           s.rekeningAtasNama as supplierRekeningAtasNama,
           s.telepon as supplierTelepon
    FROM bkk b
    LEFT JOIN suppliers s ON (b.supplierId = s.id OR b.perusahaan = s.name)
    ORDER BY b.id DESC
  `).all();

  // Fetch document counts and latest document for each BKK
  const docStmt = db.prepare(`
    SELECT id, bkkId, version, fileName, originalName, fileSize, fileType, status, uploadedBy, uploadedAt, verifiedBy, verifiedAt, rejectionReason
    FROM bkk_documents
    WHERE bkkId = ?
    ORDER BY version DESC LIMIT 1
  `);
  const docCountStmt = db.prepare('SELECT COUNT(*) as count FROM bkk_documents WHERE bkkId = ?');

  const normalized = bkks.map((b) => {
    const latestDoc = docStmt.get(b.id) || null;
    const docCount = docCountStmt.get(b.id)?.count || 0;

    return {
      ...b,
      supplierId: b.supplierId || null,
      customerId: b.customerId || null,
      volume: Number(b.volume ?? b.kubikasi ?? 0),
      kubikasi: Number(b.kubikasi ?? b.volume ?? 0),
      amount: Number(b.amount ?? 0),
      timestamp: b.timestamp || (b.tanggal ? `${b.tanggal} 08:00:00` : ''),
      tanggal: b.tanggal || (b.timestamp ? b.timestamp.slice(0, 10) : ''),
      subDetail: b.subDetail || b.penerima || '-',
      penerima: b.penerima || b.subDetail || '-',
      jenis: b.jenis || 'CURAH | JASA ANGKUT + MATERIAL',
      periode: b.periode || (b.tanggal ? b.tanggal.slice(0, 7) : (b.timestamp ? b.timestamp.slice(0, 7) : '-')),
      statusBayar: b.statusBayar || 'Belum Dibayar',
      status: b.status || 'pending_approval',
      createdBy: b.createdBy || 'Admin',
      approvedBy: b.approvedBy || null,
      approvedAt: b.approvedAt || null,
      rejectionReason: b.rejectionReason || null,
      kodeTransaksi: b.kodeTransaksi || '-',
      perusahaan: b.perusahaan || '-',
      material: b.material || '-',
      latestDocument: latestDoc ? {
        ...latestDoc,
        fileUrl: `/api/bkk/documents/file/${latestDoc.id}`,
      } : null,
      documentCount: docCount,
      hasSignedDocument: Boolean(latestDoc),
    };
  });
  res.json(normalized);
});

// Get available completed orders that do not yet have an associated BKK (Cash-Out)
app.get('/api/bkk/available-orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT 
        j.id as jurnalId,
        j.nomorRO,
        j.poNumber,
        j.preOrderId,
        j.customer,
        j.customerAddress,
        j.material,
        j.totalVolume,
        j.targetVolume,
        j.satuan,
        j.hargaBeli,
        j.hargaJual,
        j.nominalBeli,
        j.status as jurnalStatus,
        p.id as poId,
        p.nomorPo as poNomorPo,
        p.nomorRO as poNomorRO,
        p.supplierId,
        p.customerId,
        p.status as poStatus,
        s.name as defaultSupplierName,
        s.bank as defaultSupplierBank,
        s.noRekening as defaultSupplierNoRekening,
        s.rekeningAtasNama as defaultSupplierRekeningAtasNama,
        s.penerima as defaultSupplierPenerima
      FROM jurnal_gi j
      LEFT JOIN pre_orders p ON (j.preOrderId = p.id OR j.nomorRO = p.nomorRO)
      LEFT JOIN suppliers s ON (p.supplierId = s.id)
      WHERE j.targetVolume > 0 
        AND j.totalVolume >= j.targetVolume
        AND NOT EXISTS (
          SELECT 1 FROM bkk b 
          WHERE (
            (b.nomorRO IS NOT NULL AND b.nomorRO != '' AND b.nomorRO = j.nomorRO)
            OR (b.jurnalId IS NOT NULL AND b.jurnalId != '' AND b.jurnalId = j.id)
            OR (b.preOrderId IS NOT NULL AND b.preOrderId != '' AND b.preOrderId = j.preOrderId)
            OR (b.poNumber IS NOT NULL AND b.poNumber != '' AND b.poNumber != '-' AND b.poNumber = j.poNumber)
          )
          AND b.status NOT IN ('REJECTED')
        )
      ORDER BY j.id DESC
    `).all();

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching available orders for BKK:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin creates BKK manually (Only after Order is fully completed based on Journal Recap)
app.post('/api/bkk', (req, res) => {
  const bkkData = req.body;
  const nowIso = new Date().toISOString();

  // 1. Resolve linked Order and Journal GI
  let jurnal = null;
  if (bkkData.jurnalId) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(bkkData.jurnalId);
  }
  if (!jurnal && bkkData.nomorRO) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE nomorRO = ?').get(bkkData.nomorRO);
  }
  if (!jurnal && bkkData.preOrderId) {
    jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE preOrderId = ?').get(bkkData.preOrderId);
  }

  let po = null;
  if (bkkData.preOrderId) {
    po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(bkkData.preOrderId);
  }
  if (!po && jurnal?.preOrderId) {
    po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(jurnal.preOrderId);
  }
  if (!po && bkkData.nomorRO) {
    po = db.prepare('SELECT * FROM pre_orders WHERE nomorRO = ?').get(bkkData.nomorRO);
  }

  // 2. CRITICAL BUSINESS RULE: Verify Order is fully completed based on actual delivery recap
  if (!jurnal && !po) {
    return res.status(400).json({
      success: false,
      message: 'Gagal membuat BKK: Data Order atau Rekapan Jurnal terkait tidak ditemukan. BKK hanya dapat dibuat untuk Order yang valid.',
    });
  }

  const targetVol = Number(jurnal?.targetVolume || po?.totalOrder || 0);

  // Compute actual delivered volume from waybills (surat_jalan)
  const sjList = db.prepare(`
    SELECT volumeAkhir FROM surat_jalan
    WHERE (jurnalId IS NOT NULL AND jurnalId = ?)
       OR (nomorRO IS NOT NULL AND nomorRO = ?)
       OR (preOrderId IS NOT NULL AND preOrderId = ?)
  `).all(jurnal?.id || '', jurnal?.nomorRO || bkkData.nomorRO || '', po?.id || '');

  const actualDeliveredVol = Number(sjList.reduce((sum, s) => sum + (Number(s.volumeAkhir) || 0), 0).toFixed(2));
  const finalDelivered = actualDeliveredVol > 0 ? actualDeliveredVol : Number(jurnal?.totalVolume || po?.terkirim || 0);

  if (targetVol <= 0 || finalDelivered < targetVol) {
    return res.status(400).json({
      success: false,
      message: `Gagal membuat BKK: Order belum selesai dikirim. Realisasi pengiriman (${finalDelivered} m³) belum memenuhi target kuantitas pesanan (${targetVol} m³) berdasarkan data Rekapan Jurnal.`,
    });
  }

  // 3. CRITICAL BUSINESS RULE: Prevent duplicate BKK creation
  const refRo = jurnal?.nomorRO || bkkData.nomorRO || po?.nomorRO || null;
  const refJurnalId = jurnal?.id || bkkData.jurnalId || null;
  const refPoId = po?.id || bkkData.preOrderId || null;
  const refPoNumber = jurnal?.poNumber || bkkData.poNumber || po?.nomorPo || null;

  const existingBkk = db.prepare(`
    SELECT id, kodeTransaksi, status FROM bkk
    WHERE ((jurnalId IS NOT NULL AND jurnalId != '' AND jurnalId = ?) 
        OR (nomorRO IS NOT NULL AND nomorRO != '' AND nomorRO = ?) 
        OR (preOrderId IS NOT NULL AND preOrderId != '' AND preOrderId = ?)
        OR (poNumber IS NOT NULL AND poNumber != '' AND poNumber != '-' AND poNumber = ?))
      AND status NOT IN ('REJECTED')
    LIMIT 1
  `).get(refJurnalId || '', refRo || '', refPoId || '', refPoNumber || '');

  if (existingBkk) {
    return res.status(400).json({
      success: false,
      message: `BKK untuk Order ini sudah pernah dibuat (${existingBkk.kodeTransaksi || existingBkk.id}, Status: ${existingBkk.status}). Sistem mencegah pembuatan BKK duplikat.`,
    });
  }

  // 4. Resolve Master Suppliers and Customers
  let supId = bkkData.supplierId || null;
  if (!supId && bkkData.perusahaan) {
    supId = db.prepare('SELECT id FROM suppliers WHERE name = ? LIMIT 1').get(bkkData.perusahaan)?.id || null;
  }
  if (!supId && po?.supplierId) supId = po.supplierId;

  let custId = bkkData.customerId || null;
  if (!custId && (bkkData.subDetail || bkkData.customer || jurnal?.customer)) {
    const custSearch = bkkData.customer || jurnal?.customer || bkkData.subDetail;
    custId = db.prepare("SELECT id FROM customers WHERE ? LIKE '%' || name || '%' LIMIT 1").get(custSearch)?.id || null;
  }
  if (!custId && po?.customerId) custId = po.customerId;

  const supplierRow = supId ? db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supId) : null;
  const finalSupplierName = supplierRow?.name || bkkData.perusahaan || 'SUPPLIER';
  const finalPenerima = supplierRow?.penerima || bkkData.penerima || finalSupplierName;

  // 5. Volume, Unit Price, and Amount resolution from verified journal recap
  const finalVolume = Number(bkkData.volume) > 0 ? Number(bkkData.volume) : finalDelivered;
  const hargaBeli = Number(bkkData.hargaSatuan) > 0 ? Number(bkkData.hargaSatuan) : Number(jurnal?.hargaBeli || po?.hargaBeli || 0);
  const finalAmount = Number(bkkData.amount) > 0 ? Number(bkkData.amount) : Math.round(finalVolume * hargaBeli);
  const ritCount = sjList.length > 0 ? sjList.length : Number(jurnal?.totalSj || bkkData.ritaseCount || 1);

  const subDetailStr = bkkData.subDetail && bkkData.subDetail !== '-'
    ? bkkData.subDetail
    : `${jurnal?.customer || po?.customer || 'Customer'} (${refRo || 'RO'})`;

  const finalPoNum = bkkData.poNumber || jurnal?.poNumber || po?.nomorPo || 'PO';
  const finalRoNum = refRo || `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const coCode = bkkData.kodeTransaksi || `${finalPoNum} - CO - ${String(finalRoNum).slice(-4).replace('-', '')}`;
  const id = bkkData.id || `BKK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;

  const createdByUser = (req.headers['x-user-email'] || req.headers['x-user-role'] || 'Admin').trim();

  // 6. Insert BKK with LOCKED / PENDING APPROVAL status
  db.prepare(`
    INSERT INTO bkk (
      id, kodeTransaksi, nomorRO, preOrderId, jurnalId, poNumber,
      supplierId, customerId, perusahaan, subDetail, penerima, material, jenis, ritaseCount,
      kubikasi, volume, satuan, hargaSatuan, amount, statusBayar, status, createdBy,
      approvedBy, approvedAt, rejectionReason,
      tanggal, timestamp, periode, tanggalBayar, rekeningSumber, rekeningTujuan,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    coCode,
    finalRoNum,
    po?.id || null,
    jurnal?.id || null,
    finalPoNum,
    supId,
    custId,
    finalSupplierName,
    subDetailStr,
    finalPenerima,
    bkkData.material || `${jurnal?.material || 'SIRTU'} (Curah)`,
    bkkData.jenis || 'CURAH | JASA ANGKUT + MATERIAL',
    ritCount,
    finalVolume,
    finalVolume,
    bkkData.satuan || jurnal?.satuan || 'm3',
    hargaBeli,
    finalAmount,
    'Belum Dibayar',
    'pending_approval', // Stage 1: LOCKED UNTIL SUPERADMIN APPROVES
    createdByUser,
    null,
    null,
    null,
    bkkData.tanggal || nowIso.split('T')[0],
    bkkData.timestamp || nowIso.replace('T', ' ').slice(0, 19),
    bkkData.periode || `Periode: ${bkkData.tanggal || nowIso.split('T')[0]}`,
    null,
    null,
    bkkData.rekeningTujuan || (supplierRow ? `${supplierRow.bank || 'BCA'} - ${supplierRow.noRekening || ''}` : '-'),
    nowIso,
    nowIso
  );

  // Record Audit Log: Stage 1 BKK Created
  logBkkAudit(id, 'BKK_CREATED', createdByUser, req.headers['x-user-role'] || 'Admin', {
    kodeTransaksi: coCode,
    nomorRO: finalRoNum,
    amount: finalAmount,
    volume: finalVolume,
    supplier: finalSupplierName,
  }, req.headers['x-user-id'] || null);

  res.status(201).json({
    success: true,
    id,
    kodeTransaksi: coCode,
    status: 'pending_approval',
    message: `BKK Cash Out ${coCode} berhasil diajukan! Status saat ini TERKUNCI (Menunggu Approval Super Admin).`,
  });
});

// Get complete print data for BKK including daily GI breakdown
app.get('/api/bkk/:id/print-data', (req, res) => {
  try {
    const { id } = req.params;
    const bkk = db.prepare(`
      SELECT b.*,
             s.bank as supplierBank,
             s.noRekening as supplierNoRekening,
             s.rekeningAtasNama as supplierRekeningAtasNama,
             s.telepon as supplierTelepon,
             s.penerima as supplierPenerimaDefault
      FROM bkk b
      LEFT JOIN suppliers s ON (b.supplierId = s.id OR b.perusahaan = s.name)
      WHERE b.id = ?
    `).get(id);

    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    // Resolve Customer info
    let customerName = bkk.customer || bkk.perusahaan || '-';
    let customerRow = null;
    if (bkk.customerId) {
      customerRow = db.prepare('SELECT * FROM customers WHERE id = ?').get(bkk.customerId);
    }
    if (!customerRow && bkk.customer) {
      customerRow = db.prepare("SELECT * FROM customers WHERE name LIKE '%' || ? || '%' LIMIT 1").get(bkk.customer);
    }
    if (customerRow) {
      customerName = customerRow.name;
    }

    // Resolve PO and RO
    const roNumber = bkk.nomorRO || '-';
    const poNumber = bkk.poNumber || '-';

    // Fetch linked Surat Jalan records to break down GI by delivery date (Requirement 4)
    const sjRows = db.prepare(`
      SELECT * FROM surat_jalan
      WHERE (nomorRO IS NOT NULL AND nomorRO != '' AND nomorRO = ?)
         OR (jurnalId IS NOT NULL AND jurnalId != '' AND jurnalId = ?)
         OR (preOrderId IS NOT NULL AND preOrderId != '' AND preOrderId = ?)
         OR (poNumber IS NOT NULL AND poNumber != '' AND poNumber != '-' AND poNumber = ?)
      ORDER BY tanggal ASC, waktu ASC, id ASC
    `).all(roNumber, bkk.jurnalId || '', bkk.preOrderId || '', poNumber);

    // Group GI deliveries strictly by date
    const dailyMap = {};
    for (const sj of sjRows) {
      const dateKey = sj.tanggal || bkk.tanggal || '-';
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          tanggal: dateKey,
          material: sj.material || bkk.material || 'SIRTU',
          ritaseCount: 0,
          volume: 0,
          suratJalanNos: [],
        };
      }
      dailyMap[dateKey].ritaseCount += 1;
      dailyMap[dateKey].volume += Number(sj.volumeAkhir) || 0;
      if (sj.nomorSj) dailyMap[dateKey].suratJalanNos.push(sj.nomorSj);
    }

    const hargaSatuan = Number(bkk.hargaSatuan) || 0;
    let dailyTransactions = Object.values(dailyMap).map((d) => {
      const vol = Number(d.volume.toFixed(2));
      const subtotal = Math.round(vol * hargaSatuan);
      return {
        tanggal: d.tanggal,
        material: d.material,
        ritaseCount: d.ritaseCount,
        suratJalanNos: d.suratJalanNos,
        volume: vol,
        hargaSatuan,
        subtotal,
      };
    });

    // Fallback if no individual surat_jalan rows found (use BKK summary)
    if (dailyTransactions.length === 0) {
      const vol = Number(bkk.volume ?? bkk.kubikasi ?? 0);
      dailyTransactions = [{
        tanggal: bkk.tanggal || '-',
        material: bkk.material || 'SIRTU',
        ritaseCount: bkk.ritaseCount || 1,
        suratJalanNos: [],
        volume: vol,
        hargaSatuan,
        subtotal: Number(bkk.amount) || Math.round(vol * hargaSatuan),
      }];
    }

    // Totals
    const totalVolume = Number(dailyTransactions.reduce((acc, curr) => acc + curr.volume, 0).toFixed(2));
    const totalAmount = dailyTransactions.reduce((acc, curr) => acc + curr.subtotal, 0) || Number(bkk.amount);

    // Parse rekening info
    let bankName = bkk.supplierBank || 'BCA';
    let noRekening = bkk.supplierNoRekening || '';
    let rekeningAtasNama = bkk.supplierRekeningAtasNama || bkk.penerima || bkk.perusahaan || '';
    if (bkk.rekeningTujuan) {
      const match = bkk.rekeningTujuan.match(/^([^-]+)-\s*([^\s]+)(?:\s+a\/n\s+(.+))?$/i);
      if (match) {
        if (!bkk.supplierBank) bankName = match[1].trim();
        if (!noRekening) noRekening = match[2].trim();
        if (!rekeningAtasNama && match[3]) rekeningAtasNama = match[3].trim();
      }
    }

    const payload = {
      bkkId: bkk.id,
      coNumber: bkk.kodeTransaksi || bkk.id,
      tanggal: bkk.tanggal,
      timestamp: bkk.timestamp,
      customer: customerName,
      poNumber: poNumber,
      nomorRO: roNumber,
      poType: bkk.jenis || 'CURAH | JASA ANGKUT + MATERIAL',
      supplier: {
        name: bkk.perusahaan || 'SUPPLIER',
        bank: bankName,
        noRekening: noRekening || '-',
        atasNama: rekeningAtasNama || '-',
        penerima: bkk.penerima || rekeningAtasNama || bkk.perusahaan || '-',
      },
      transactions: dailyTransactions,
      totalVolume,
      totalAmount,
      status: bkk.status,
      approvedBy: bkk.approvedBy,
      approvedAt: bkk.approvedAt,
      createdBy: bkk.createdBy,
    };

    res.json({ success: true, data: payload });
  } catch (err) {
    console.error('Error getting BKK print data:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Superadmin Reviews & Approves BKK (Stage 2: Administrative Approval)
app.put('/api/bkk/:id/approve', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menyetujui BKK (Cash Out)')) return;

  try {
    const { id } = req.params;
    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const curStatus = String(bkk.status || '').toUpperCase().trim();
    if (['APPROVED', 'PENDING_VERIFICATION', 'REVISION_REQUIRED', 'PAID'].includes(curStatus)) {
      return res.status(400).json({ success: false, message: `BKK ${id} sudah disetujui sebelumnya.` });
    }

    if (curStatus !== 'MENUNGGU_APPROVAL' && curStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Hanya BKK berstatus Menunggu Approval yang dapat disetujui (Status saat ini: ${bkk.status}).`,
      });
    }

    const approver = (req.body?.approver || req.headers['x-user-name'] || req.headers['x-user-email'] || 'David Rusiah (Direktur)').trim();
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE bkk
      SET status = 'approved', approvedBy = ?, approvedAt = ?, rejectionReason = NULL, updated_at = ?
      WHERE id = ?
    `).run(approver, nowIso, nowIso, id);

    // Record Audit Log: Stage 2 BKK Approved
    logBkkAudit(id, 'BKK_APPROVED', approver, 'Super Admin', {
      approvedAt: nowIso,
    }, req.headers['x-user-id'] || null);

    const updated = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `BKK ${updated.kodeTransaksi || id} resmi disetujui secara administratif oleh Super Admin! Siap untuk proses cetak dan penandatanganan fisik.`,
      data: updated,
    });
  } catch (err) {
    console.error('Error approving BKK:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Superadmin Rejects BKK
app.put('/api/bkk/:id/reject', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menolak BKK (Cash Out)')) return;

  try {
    const { id } = req.params;
    const { reason = 'Ditolak oleh Super Admin' } = req.body;
    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const curStatus = String(bkk.status || '').toUpperCase().trim();
    if (curStatus !== 'MENUNGGU_APPROVAL' && curStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Hanya BKK berstatus Menunggu Approval yang dapat ditolak (Status saat ini: ${bkk.status}).`,
      });
    }

    const rejecter = (req.body.approver || req.headers['x-user-name'] || req.headers['x-user-email'] || 'Super Admin (Direktur)').trim();
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE bkk
      SET status = 'REJECTED', rejectionReason = ?, approvedBy = ?, approvedAt = ?, updated_at = ?
      WHERE id = ?
    `).run(reason, rejecter, nowIso, nowIso, id);

    // Record Audit Log
    logBkkAudit(id, 'BKK_REJECTED', rejecter, 'Super Admin', {
      reason,
      rejectedAt: nowIso,
    }, req.headers['x-user-id'] || null);

    const updated = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `BKK ${updated.kodeTransaksi || id} ditolak oleh Super Admin.`,
      data: updated,
    });
  } catch (err) {
    console.error('Error rejecting BKK:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stage 3: Record Document Print Activity in Audit Trail
app.post('/api/bkk/:id/record-print', (req, res) => {
  try {
    const { id } = req.params;
    const bkk = db.prepare('SELECT id, kodeTransaksi, status FROM bkk WHERE id = ?').get(id);
    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const printer = (req.headers['x-user-name'] || req.headers['x-user-email'] || req.body?.printer || 'Admin').trim();
    const role = (req.headers['x-user-role'] || 'Admin').trim();
    const nowIso = new Date().toISOString();

    logBkkAudit(id, 'DOCUMENT_PRINTED', printer, role, {
      printTimestamp: nowIso,
    }, req.headers['x-user-id'] || null);

    res.json({ success: true, message: 'Aktivitas cetak dokumen berhasil dicatat dalam audit trail.' });
  } catch (err) {
    console.error('Error recording print:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stage 4: Admin Uploads Signed Document (PNG, JPG, PDF)
app.post('/api/bkk/:id/documents', (req, res) => {
  try {
    const { id } = req.params;
    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);
    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    // Only allow uploading when approved, revision required, or pending verification
    const currentStatus = String(bkk.status || '').toLowerCase().trim();
    if (!['approved', 'revision_required', 'pending_verification'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Dokumen hanya dapat diunggah jika BKK berstatus APPROVED atau REVISION_REQUIRED (Status saat ini: ${bkk.status}).`,
      });
    }

    const fileBase64 = req.body.fileBase64 || req.body.fileData;
    const fileName = req.body.fileName || req.body.originalName;
    const fileType = req.body.fileType || (fileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
    const notes = req.body.notes;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ success: false, message: 'File dokumen dan nama file wajib disertakan.' });
    }

    const uploader = (req.headers['x-user-name'] || req.headers['x-user-email'] || 'Admin').trim();
    const uploaderRole = (req.headers['x-user-role'] || 'Admin').trim();
    const nowIso = new Date().toISOString();

    // Determine version: incremental
    const maxVerRow = db.prepare('SELECT MAX(version) as maxVer FROM bkk_documents WHERE bkkId = ?').get(id);
    const nextVersion = (maxVerRow?.maxVer || 0) + 1;

    // Ensure uploads directory exists
    if (!fs.existsSync(bkkUploadsDir)) {
      fs.mkdirSync(bkkUploadsDir, { recursive: true });
    }

    // Save file to disk
    const ext = path.extname(fileName) || (fileType?.includes('pdf') ? '.pdf' : '.png');
    const safeFileName = `${id}-v${nextVersion}-${Date.now()}${ext}`;
    const diskPath = path.join(bkkUploadsDir, safeFileName);

    // Decode base64
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(diskPath, fileBuffer);

    const docId = `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    db.prepare(`
      INSERT INTO bkk_documents (
        id, bkkId, version, fileName, originalName, filePath, fileSize, fileType,
        notes, status, uploadedBy, uploadedAt, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      id,
      nextVersion,
      safeFileName,
      fileName,
      diskPath,
      fileBuffer.length,
      fileType || 'application/pdf',
      notes || null,
      'DRAFT',
      uploader,
      nowIso,
      nowIso,
      nowIso
    );

    // Log audit
    const action = currentStatus === 'revision_required' ? 'REVISED_DOCUMENT_UPLOADED' : 'DOCUMENT_UPLOADED';
    logBkkAudit(id, action, uploader, uploaderRole, {
      docId,
      version: nextVersion,
      fileName,
      fileSize: fileBuffer.length,
    }, req.headers['x-user-id'] || null);

    const createdDoc = db.prepare('SELECT * FROM bkk_documents WHERE id = ?').get(docId);

    res.status(201).json({
      success: true,
      message: `Dokumen fisik bertanda tangan (Versi ${nextVersion}) berhasil diunggah. Silakan periksa kembali sebelum mengajukan verifikasi ke Superadmin.`,
      data: {
        ...createdDoc,
        fileUrl: `/api/bkk/documents/file/${createdDoc.id}`,
      },
    });
  } catch (err) {
    console.error('Error uploading BKK document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stage 4 to 5: Admin Submits Signed Document for Superadmin Verification
app.post('/api/bkk/:id/submit-verification', (req, res) => {
  try {
    const { id } = req.params;
    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);
    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const currentStatus = String(bkk.status || '').toLowerCase().trim();
    if (currentStatus !== 'approved' && currentStatus !== 'revision_required' && currentStatus !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan verifikasi hanya dapat dilakukan untuk BKK berstatus APPROVED atau REVISION_REQUIRED (Status saat ini: ${bkk.status}).`,
      });
    }

    // Find latest draft document
    let latestDoc = db.prepare(`
      SELECT * FROM bkk_documents 
      WHERE bkkId = ? AND UPPER(status) IN ('DRAFT', 'SUBMITTED', 'PENDING') 
      ORDER BY version DESC LIMIT 1
    `).get(id);

    if (!latestDoc) {
      latestDoc = db.prepare(`
        SELECT * FROM bkk_documents 
        WHERE bkkId = ? 
        ORDER BY version DESC LIMIT 1
      `).get(id);
    }

    if (!latestDoc) {
      return res.status(400).json({
        success: false,
        message: 'Gagal mengajukan: Belum ada berkas dokumen bertanda tangan yang diunggah untuk BKK ini.',
      });
    }

    const nowIso = new Date().toISOString();
    const submitter = (req.headers['x-user-name'] || req.headers['x-user-email'] || 'Admin').trim();
    const role = (req.headers['x-user-role'] || 'Admin').trim();

    // Lock document into SUBMITTED status and transition BKK to pending_verification
    db.prepare(`
      UPDATE bkk_documents SET status = 'SUBMITTED', updated_at = ? WHERE id = ?
    `).run(nowIso, latestDoc.id);

    db.prepare(`
      UPDATE bkk SET status = 'pending_verification', updated_at = ? WHERE id = ?
    `).run(nowIso, id);

    logBkkAudit(id, 'DOCUMENT_SUBMITTED', submitter, role, {
      docId: latestDoc.id,
      version: latestDoc.version,
      fileName: latestDoc.originalName,
    }, req.headers['x-user-id'] || null);

    const updatedBkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Dokumen bertanda tangan (Versi ${latestDoc.version}) berhasil diajukan untuk verifikasi Superadmin! Dokumen kini terkunci selama masa verifikasi.`,
      data: updatedBkk,
    });
  } catch (err) {
    console.error('Error submitting BKK verification:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stage 5-A & Stage 6: Superadmin Verifies Signed Document and Settles as PAID (LUNAS)
app.put('/api/bkk/:id/verify-approve', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'memverifikasi dokumen fisik BKK')) return;

  try {
    const { id } = req.params;
    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);
    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const curStatus = String(bkk.status || '').toLowerCase().trim();
    const validStatuses = ['pending_verification', 'menunggu_verifikasi', 'approved', 'disetujui'];
    if (!validStatuses.includes(curStatus)) {
      return res.status(400).json({
        success: false,
        message: `Hanya BKK berstatus Menunggu Verifikasi Dokumen atau Disetujui yang dapat diverifikasi (Status saat ini: ${bkk.status}).`,
      });
    }

    let latestDoc = db.prepare(`
      SELECT * FROM bkk_documents 
      WHERE bkkId = ? AND UPPER(status) IN ('SUBMITTED', 'DRAFT', 'PENDING', 'PENDING_VERIFICATION') 
      ORDER BY version DESC LIMIT 1
    `).get(id);

    if (!latestDoc) {
      latestDoc = db.prepare(`
        SELECT * FROM bkk_documents 
        WHERE bkkId = ? 
        ORDER BY version DESC LIMIT 1
      `).get(id);
    }

    const nowIso = new Date().toISOString();
    let verifier = 'David Rusiah (Super Admin / Direktur)';
    if (typeof req.body === 'string' && req.body.trim()) {
      verifier = req.body.trim();
    } else if (req.body && typeof req.body === 'object') {
      verifier = req.body.verifier || req.body.approver || req.headers['x-user-name'] || req.headers['x-user-email'] || 'David Rusiah (Super Admin / Direktur)';
    } else if (req.headers['x-user-name']) {
      verifier = req.headers['x-user-name'].trim();
    }

    const tanggalBayar = (req.body && typeof req.body === 'object' && req.body.tanggalBayar) ? req.body.tanggalBayar : nowIso.split('T')[0];

    if (!latestDoc) {
      const docId = `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const safeFileName = `${id}-v1-verified.pdf`;
      db.prepare(`
        INSERT INTO bkk_documents (
          id, bkkId, version, fileName, originalName, filePath, fileSize, fileType,
          notes, status, uploadedBy, uploadedAt, verifiedBy, verifiedAt, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        docId,
        id,
        1,
        safeFileName,
        'Dokumen_Kas_Keluar_Fisik.pdf',
        path.join(bkkUploadsDir, safeFileName),
        0,
        'application/pdf',
        'Dokumen fisik diverifikasi dan disahkan oleh Super Admin',
        'VERIFIED',
        verifier,
        nowIso,
        verifier,
        nowIso,
        nowIso,
        nowIso
      );
      latestDoc = db.prepare('SELECT * FROM bkk_documents WHERE id = ?').get(docId);
    } else {
      // 1. Mark document VERIFIED
      db.prepare(`
        UPDATE bkk_documents 
        SET status = 'VERIFIED', verifiedBy = ?, verifiedAt = ?, updated_at = ?
        WHERE id = ?
      `).run(verifier, nowIso, nowIso, latestDoc.id);
    }

    // 2. Mark BKK as paid / LUNAS
    db.prepare(`
      UPDATE bkk 
      SET status = 'paid', statusBayar = 'Lunas', tanggalBayar = ?, verifiedBy = ?, verifiedAt = ?, updated_at = ?
      WHERE id = ?
    `).run(tanggalBayar, verifier, nowIso, nowIso, id);

    // 3. Log Audit
    logBkkAudit(id, 'VERIFICATION_APPROVED', verifier, 'Super Admin', {
      docId: latestDoc.id,
      version: latestDoc.version,
      verifiedAt: nowIso,
    }, req.headers['x-user-id'] || null);

    logBkkAudit(id, 'CASHOUT_FINALIZED', verifier, 'Super Admin', {
      status: 'paid',
      statusBayar: 'Lunas',
      settlementDate: tanggalBayar,
    }, req.headers['x-user-id'] || null);

    const updatedBkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Dokumen fisik Cash-Out resmi diverifikasi dan transaksi difinalisasi sebagai LUNAS oleh Superadmin!`,
      data: updatedBkk,
    });
  } catch (err) {
    console.error('Error approving BKK verification:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stage 5-B: Superadmin Rejects Document & Requests Revision
app.put('/api/bkk/:id/verify-reject', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menolak verifikasi dokumen BKK')) return;

  try {
    const { id } = req.params;
    let reason = '';
    let verifier = 'David Rusiah (Super Admin / Direktur)';
    if (typeof req.body === 'string') {
      reason = req.body;
    } else if (req.body && typeof req.body === 'object') {
      reason = req.body.reason || req.body.alasan || '';
      if (req.body.verifier) verifier = req.body.verifier;
    } else if (req.headers['x-user-name']) {
      verifier = req.headers['x-user-name'];
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan / revisi dokumen wajib diisi secara jelas oleh Superadmin.',
      });
    }

    const bkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);
    if (!bkk) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    const curStatus = String(bkk.status || '').toLowerCase().trim();
    const validStatuses = ['pending_verification', 'menunggu_verifikasi', 'approved', 'disetujui'];
    if (!validStatuses.includes(curStatus)) {
      return res.status(400).json({
        success: false,
        message: `Hanya BKK berstatus Menunggu Verifikasi Dokumen yang dapat ditolak/diminta revisi (Status saat ini: ${bkk.status}).`,
      });
    }

    const latestDoc = db.prepare(`
      SELECT * FROM bkk_documents 
      WHERE bkkId = ? AND status IN ('SUBMITTED', 'DRAFT') 
      ORDER BY version DESC LIMIT 1
    `).get(id);

    const nowIso = new Date().toISOString();

    if (latestDoc) {
      db.prepare(`
        UPDATE bkk_documents 
        SET status = 'REJECTED', verifiedBy = ?, verifiedAt = ?, rejectionReason = ?, updated_at = ?
        WHERE id = ?
      `).run(verifier, nowIso, reason.trim(), nowIso, latestDoc.id);
    }

    db.prepare(`
      UPDATE bkk 
      SET status = 'revision_required', rejectionReason = ?, updated_at = ?
      WHERE id = ?
    `).run(reason.trim(), nowIso, id);

    logBkkAudit(id, 'VERIFICATION_REJECTED', verifier, 'Super Admin', {
      docId: latestDoc?.id || null,
      version: latestDoc?.version || null,
      reason: reason.trim(),
      rejectedAt: nowIso,
    }, req.headers['x-user-id'] || null);

    const updatedBkk = db.prepare('SELECT * FROM bkk WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Dokumen fisik Cash-Out ditolak. Status BKK dikembalikan ke Admin untuk perbaikan tanda tangan.`,
      data: updatedBkk,
    });
  } catch (err) {
    console.error('Error rejecting BKK verification:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Retrieve document history and versions for a BKK
app.get('/api/bkk/:id/documents', (req, res) => {
  try {
    const { id } = req.params;
    const docs = db.prepare(`
      SELECT * FROM bkk_documents WHERE bkkId = ? ORDER BY version DESC
    `).all(id);

    const formatted = docs.map((d) => ({
      ...d,
      fileUrl: `/api/bkk/documents/file/${d.id}`,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching BKK documents:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve physical document file securely
app.get('/api/bkk/documents/file/:docId', (req, res) => {
  try {
    const { docId } = req.params;
    const doc = db.prepare('SELECT * FROM bkk_documents WHERE id = ?').get(docId);
    if (!doc || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, message: 'Berkas dokumen tidak ditemukan di server.' });
    }

    res.setHeader('Content-Type', doc.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName || doc.fileName}"`);
    const stream = fs.createReadStream(doc.filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('Error serving BKK document:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Retrieve complete immutable audit trail for a BKK
app.get('/api/bkk/:id/audit-trail', (req, res) => {
  try {
    const { id } = req.params;
    const logs = db.prepare(`
      SELECT * FROM bkk_audit_logs WHERE bkkId = ? ORDER BY timestamp DESC, id DESC
    `).all(id);

    const parsed = logs.map((l) => ({
      ...l,
      details: l.details ? (() => { try { return JSON.parse(l.details); } catch(e) { return l.details; } })() : null,
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error fetching BKK audit trail:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark BKK Paid (Strictly only after Superadmin verification)
app.patch('/api/bkk/pay', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'melunasi BKK (Cash Out)')) return;

  const { ids, tanggalBayar = new Date().toISOString().split('T')[0] } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs array required' });
  }

  // Check if any BKK is not verified or already paid
  const placeholders = ids.map(() => '?').join(',');
  const unapproved = db.prepare(`
    SELECT id, kodeTransaksi, status, statusBayar FROM bkk
    WHERE id IN (${placeholders}) AND status NOT IN ('pending_verification', 'paid', 'approved', 'APPROVED')
  `).all(...ids);

  if (unapproved.length > 0) {
    const names = unapproved.map((u) => u.kodeTransaksi || u.id).join(', ');
    return res.status(400).json({
      success: false,
      message: `Akses ditolak: BKK (${names}) belum melalui tahapan verifikasi yang sah sehingga tidak dapat dicairkan atau dibayar.`,
    });
  }

  const verifier = (req.headers['x-user-name'] || req.headers['x-user-email'] || 'David Rusiah (Super Admin)').trim();
  for (const id of ids) {
    db.prepare("UPDATE bkk SET status = 'paid', statusBayar = 'Lunas', tanggalBayar = ? WHERE id = ?")
      .run(tanggalBayar, id);
    logBkkAudit(id, 'CASHOUT_FINALIZED', verifier, 'Super Admin', {
      status: 'paid',
      statusBayar: 'Lunas',
      settlementDate: tanggalBayar,
    }, req.headers['x-user-id'] || null);
  }

  res.json({ success: true, count: ids.length });
});

// Delete BKK Cash Out (Superadmin Only - Locked once PAID)
app.delete('/api/bkk/:id', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menghapus data BKK (Cash Out)')) return;

  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, status, statusBayar FROM bkk WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `BKK ${id} tidak ditemukan.` });
    }

    if (existing.status === 'paid' || existing.statusBayar === 'Lunas') {
      return res.status(403).json({
        success: false,
        message: `BKK ${id} telah LUNAS dan difinalisasi secara permanen. Rekaman finansial yang sudah sah tidak dapat dihapus demi keamanan audit.`,
      });
    }

    db.prepare('DELETE FROM bkk_documents WHERE bkkId = ?').run(id);
    db.prepare('DELETE FROM bkk_audit_logs WHERE bkkId = ?').run(id);
    db.prepare('DELETE FROM bkk WHERE id = ?').run(id);
    res.json({ success: true, message: `BKK ${id} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// INVOICES ROUTES
// ==========================================
app.get('/api/invoices', (req, res) => {
  const invs = db.prepare(`
    SELECT i.*,
           c.alamat as customerAddressMaster,
           c.npwp as customerNpwp,
           c.telepon as customerTelepon
    FROM invoices i
    LEFT JOIN customers c ON (i.customerId = c.id OR i.perusahaan = c.name)
    ORDER BY i.id DESC
  `).all();

  const normalized = invs.map((inv) => ({
    ...inv,
    customerId: inv.customerId || null,
    supplierId: inv.supplierId || null,
    volume: Number(inv.volume || 0),
    amount: Number(inv.amount || 0),
    hargaSatuan: Number(inv.hargaSatuan || 0),
    subtotalJasa: Number(inv.subtotalJasa || inv.amount || 0),
    ppnNominal: Number(inv.ppnNominal || 0),
    pphNominal: Number(inv.pphNominal || 0),
    timestamp: inv.timestamp || (inv.tanggal ? `${inv.tanggal} 10:00:00` : ''),
    tanggal: inv.tanggal || (inv.timestamp ? inv.timestamp.slice(0, 10) : ''),
    statusBayar: inv.statusBayar || 'Belum Dibayar',
    kodeTransaksi: inv.kodeTransaksi || '-',
    perusahaan: inv.perusahaan || '-',
    material: inv.material || '-',
    jenis: inv.jenis || 'JASA ANGKUT + MATERIAL',
    periode: inv.periode || (inv.tanggal ? `Periode: [${inv.tanggal}]` : '-'),
  }));
  res.json(normalized);
});

app.post('/api/invoices', (req, res) => {
  const invData = req.body;
  const id = invData.id || `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;
  const kodeTransaksi = invData.kodeTransaksi || invData.nomorInvoice || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const nowIso = new Date().toISOString();

  let custId = invData.customerId || null;
  if (!custId && (invData.perusahaan || invData.pelanggan)) {
    const cName = invData.pelanggan || invData.perusahaan;
    custId = db.prepare('SELECT id FROM customers WHERE name = ? LIMIT 1').get(cName)?.id || null;
  }
  let supId = invData.supplierId || null;

  db.prepare(`
    INSERT INTO invoices (
      id, kodeTransaksi, nomorRO, preOrderId, jurnalId, poNumber,
      customerId, supplierId, perusahaan, customerAddress, material, jenis, volume, satuan,
      hargaSatuan, subtotalJasa, ppnNominal, pphNominal, amount, statusBayar,
      tanggal, waktu, timestamp, periode, kirimKeRekening, rekeningAtasNama,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    kodeTransaksi,
    invData.nomorRO || null,
    invData.preOrderId || null,
    invData.jurnalId || null,
    invData.poNumber || null,
    custId,
    supId,
    invData.perusahaan || invData.pelanggan || 'PT CUSTOMER',
    invData.customerAddress || '',
    invData.material || invData.materialName || 'SIRTU',
    invData.jenis || 'JASA ANGKUT + MATERIAL',
    Number(invData.volume) || 0,
    invData.satuan || 'm3',
    Number(invData.hargaSatuan) || 0,
    Number(invData.subtotalJasa) || Number(invData.amount) || 0,
    Number(invData.ppnNominal) || 0,
    Number(invData.pphNominal) || 0,
    Number(invData.totalTagihan) || Number(invData.amount) || 0,
    invData.statusBayar || 'Belum Dibayar',
    invData.tanggal || nowIso.split('T')[0],
    invData.waktu || '10:00',
    invData.timestamp || nowIso.replace('T', ' ').slice(0, 19),
    invData.periode || `Periode: [${invData.tanggal || nowIso.split('T')[0]}]`,
    invData.kirimKeRekening || 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    invData.rekeningAtasNama || 'PT Berkah Alam Semesta',
    nowIso,
    nowIso
  );

  res.status(201).json({ success: true, id, message: 'Invoice berhasil disimpan ke database.' });
});

app.patch('/api/invoices/pay', (req, res) => {
  const { ids, tanggalBayar = new Date().toISOString().split('T')[0] } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'IDs array required' });

  for (const id of ids) {
    db.prepare('UPDATE invoices SET statusBayar = ?, tanggalBayar = ?, updated_at = ? WHERE id = ?')
      .run('Lunas', tanggalBayar, new Date().toISOString(), id);
  }

  res.json({ success: true, count: ids.length });
});

// Delete Invoice (Superadmin Only)
app.delete('/api/invoices/:id', (req, res) => {
  if (!verifySuperAdminPermission(req, res, 'menghapus data Invoice')) return;
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM invoices WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Invoice ${id} tidak ditemukan.` });
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    res.json({ success: true, message: `Invoice ${id} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// LAPORAN / REPORTS ROUTES (PPN, PPh 23, All in One, Supplier)
// ==========================================

function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

function checkReportPermission(req, res) {
  const role = req.headers['x-user-role'] || req.query.user_role;
  if (role && role !== 'superadmin') {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak: Menu Laporan hanya dapat diakses oleh Super Admin.',
    });
    return false;
  }
  return true;
}

// 1. PPN Report
app.get('/api/reports/ppn', (req, res) => {
  if (!checkReportPermission(req, res)) return;

  const { start_date, end_date } = req.query;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const start = start_date || defaultStart;
  const end = end_date || defaultEnd;

  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter start_date dan end_date wajib diisi dengan format YYYY-MM-DD yang valid.',
    });
  }

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: 'Tanggal akhir (end_date) tidak boleh lebih awal dari tanggal mulai (start_date).',
    });
  }

  const transactions = db.prepare(`
    SELECT * FROM invoices
    WHERE tanggal >= ? AND tanggal <= ?
    ORDER BY tanggal DESC, id DESC
  `).all(start, end);

  const totalDpp = transactions.reduce((acc, t) => acc + (Number(t.dpp) || 0), 0);
  const totalPpn = transactions.reduce((acc, t) => acc + (Number(t.ppn) || 0), 0);
  const totalAmount = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  res.json({
    success: true,
    data: transactions,
    summary: {
      totalDpp,
      totalPpn,
      totalAmount,
      totalTransactions: transactions.length,
    },
    filters: { start_date: start, end_date: end },
  });
});

// 2. PPh 21 Report (Article 21 Income Tax)
const handlePph21Report = (req, res) => {
  if (!checkReportPermission(req, res)) return;

  const { start_date, end_date } = req.query;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const start = start_date || defaultStart;
  const end = end_date || defaultEnd;

  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter start_date dan end_date wajib diisi dengan format YYYY-MM-DD yang valid.',
    });
  }

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: 'Tanggal akhir (end_date) tidak boleh lebih awal dari tanggal mulai (start_date).',
    });
  }

  let transactions = [];
  try {
    transactions = db.prepare(`
      SELECT * FROM pph21_records
      WHERE tanggal >= ? AND tanggal <= ?
      ORDER BY tanggal DESC, id DESC
    `).all(start, end);
  } catch (err) {
    console.warn('pph21_records query fallback:', err.message);
  }

  const totalDpp = transactions.reduce((acc, t) => acc + (Number(t.dpp) || 0), 0);
  const totalPotonganPph = transactions.reduce((acc, t) => acc + (Number(t.potonganPph) || 0), 0);
  const totalNetto = transactions.reduce((acc, t) => acc + (Number(t.nettoBkk) || 0), 0);

  res.json({
    success: true,
    data: transactions,
    summary: {
      totalDpp,
      totalPotonganPph,
      totalNetto,
      totalTransactions: transactions.length,
    },
    filters: { start_date: start, end_date: end },
  });
};

app.get('/api/reports/pph-21', handlePph21Report);
app.get('/api/reports/pph21', handlePph21Report);

// 3. PPh 23 Report (Article 23 Income Tax)
app.get('/api/reports/pph-23', (req, res) => {
  if (!checkReportPermission(req, res)) return;

  const { start_date, end_date } = req.query;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const start = start_date || defaultStart;
  const end = end_date || defaultEnd;

  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter start_date dan end_date wajib diisi dengan format YYYY-MM-DD yang valid.',
    });
  }

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: 'Tanggal akhir (end_date) tidak boleh lebih awal dari tanggal mulai (start_date).',
    });
  }

  const transactions = db.prepare(`
    SELECT * FROM pph23_records
    WHERE tanggal >= ? AND tanggal <= ?
    ORDER BY tanggal DESC, id DESC
  `).all(start, end);

  const totalDpp = transactions.reduce((acc, t) => acc + (Number(t.dpp) || 0), 0);
  const totalPotonganPph = transactions.reduce((acc, t) => acc + (Number(t.potonganPph) || 0), 0);
  const totalNetto = transactions.reduce((acc, t) => acc + (Number(t.nettoBkk) || 0), 0);

  res.json({
    success: true,
    data: transactions,
    summary: {
      totalDpp,
      totalPotonganPph,
      totalNetto,
      totalTransactions: transactions.length,
    },
    filters: { start_date: start, end_date: end },
  });
});

// 3. All in One Report
app.get('/api/reports/all-in-one', (req, res) => {
  if (!checkReportPermission(req, res)) return;

  const { customer_id, ro_id, po_customer_no } = req.query;

  if (!customer_id && !ro_id && !po_customer_no) {
    return res.status(400).json({
      success: false,
      message: 'Minimal salah satu filter (customer_id, ro_id, atau po_customer_no) harus diisi.',
    });
  }

  // 1. Customer
  let customer = null;
  if (customer_id) {
    customer = db.prepare(`
      SELECT * FROM customers 
      WHERE id = ? OR LOWER(name) LIKE ? OR LOWER(alias) = ? OR LOWER(kodePrefix) = ?
    `).get(customer_id, `%${customer_id.toLowerCase()}%`, customer_id.toLowerCase(), customer_id.toLowerCase());
  }

  // Build flexible customer matching keywords (handles "PT LION WINGS" vs "LION WINGS, PT")
  const customerTerms = [];
  if (customer) {
    customerTerms.push(`%${customer.name.toLowerCase()}%`);
    if (customer.alias) customerTerms.push(`%${customer.alias.toLowerCase()}%`);
    if (customer.kodePrefix) customerTerms.push(`%${customer.kodePrefix.toLowerCase()}%`);
    const cleanWords = customer.name
      .toLowerCase()
      .replace(/\b(pt|cv|tbk|persero)\b/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 3);
    for (const w of cleanWords) {
      customerTerms.push(`%${w}%`);
    }
  } else if (customer_id) {
    customerTerms.push(`%${customer_id.toLowerCase()}%`);
  }

  const custClause = (colName) => {
    if (customerTerms.length === 0) return '';
    return ' AND (' + customerTerms.map(() => `LOWER(${colName}) LIKE ?`).join(' OR ') + ')';
  };

  // 2. Pre Orders (RO)
  let poQuery = 'SELECT * FROM pre_orders WHERE 1=1';
  const poParams = [];
  if (customerTerms.length > 0) {
    poQuery += custClause('customer');
    poParams.push(...customerTerms);
  }
  if (ro_id) {
    poQuery += ' AND (id = ? OR LOWER(nomorRO) LIKE ?)';
    poParams.push(ro_id, `%${ro_id.toLowerCase()}%`);
  }
  if (po_customer_no) {
    poQuery += ' AND (nomorPo LIKE ? OR nomorPoCustomer LIKE ?)';
    poParams.push(`%${po_customer_no}%`, `%${po_customer_no}%`);
  }
  poQuery += ' ORDER BY tanggal DESC';
  const preOrders = db.prepare(poQuery).all(...poParams);

  // Parse items in pre_orders
  preOrders.forEach((po) => {
    if (po.items && typeof po.items === 'string') {
      try { po.items = JSON.parse(po.items); } catch (e) { po.items = []; }
    }
  });

  // 3. Surat Jalan
  let sjQuery = 'SELECT * FROM surat_jalan WHERE 1=1';
  const sjParams = [];
  if (customerTerms.length > 0) {
    sjQuery += custClause('customer');
    sjParams.push(...customerTerms);
  }
  if (ro_id) {
    sjQuery += ' AND (nomorRO LIKE ? OR preOrderId = ?)';
    sjParams.push(`%${ro_id}%`, ro_id);
  }
  if (po_customer_no) {
    sjQuery += ' AND poNumber LIKE ?';
    sjParams.push(`%${po_customer_no}%`);
  }
  sjQuery += ' ORDER BY tanggal DESC, id DESC';
  const suratJalan = db.prepare(sjQuery).all(...sjParams);

  // 4. Invoices
  let invQuery = 'SELECT * FROM invoices WHERE 1=1';
  const invParams = [];
  if (customerTerms.length > 0) {
    invQuery += custClause('customer');
    invParams.push(...customerTerms);
  }
  if (ro_id) {
    invQuery += ' AND nomorRO LIKE ?';
    invParams.push(`%${ro_id}%`);
  }
  if (po_customer_no) {
    invQuery += ' AND poNumber LIKE ?';
    invParams.push(`%${po_customer_no}%`);
  }
  invQuery += ' ORDER BY tanggal DESC, id DESC';
  const invoices = db.prepare(invQuery).all(...invParams);

  // 5. BKK
  let bkkQuery = 'SELECT * FROM bkk WHERE 1=1';
  const bkkParams = [];
  if (customerTerms.length > 0) {
    bkkQuery += ' AND (' + customerTerms.map(() => '(LOWER(perusahaan) LIKE ? OR LOWER(penerima) LIKE ?)').join(' OR ') + ')';
    for (const term of customerTerms) {
      bkkParams.push(term, term);
    }
  }
  bkkQuery += ' ORDER BY tanggal DESC, id DESC';
  const bkk = db.prepare(bkkQuery).all(...bkkParams);

  // Summary Metrics
  const totalVolumeKirim = suratJalan.reduce((sum, sj) => sum + (Number(sj.volumeAkhir) || 0), 0);
  const totalTagihan = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const totalTerbayar = invoices
    .filter((inv) => inv.statusBayar === 'Lunas')
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const sisaPiutang = totalTagihan - totalTerbayar;

  res.json({
    success: true,
    data: {
      customer: customer || (customer_id ? { name: customer_id } : null),
      preOrders,
      suratJalan,
      invoices,
      bkk,
    },
    summary: {
      totalVolumeKirim,
      totalTagihan,
      totalTerbayar,
      sisaPiutang,
      totalPreOrders: preOrders.length,
      totalSuratJalan: suratJalan.length,
      totalInvoices: invoices.length,
      totalBkk: bkk.length,
    },
    filters: {
      customer_id: customer_id || null,
      ro_id: ro_id || null,
      po_customer_no: po_customer_no || null,
    },
  });
});

// 4. Supplier Report
app.get('/api/reports/supplier', (req, res) => {
  if (!checkReportPermission(req, res)) return;

  const { supplier_id, start_date, end_date } = req.query;

  if (!supplier_id) {
    return res.status(400).json({
      success: false,
      message: 'Parameter supplier_id wajib diisi.',
    });
  }

  if (!start_date || !end_date || !isValidDate(start_date) || !isValidDate(end_date)) {
    return res.status(400).json({
      success: false,
      message: 'Parameter start_date dan end_date wajib diisi dengan format YYYY-MM-DD yang valid.',
    });
  }

  if (end_date < start_date) {
    return res.status(400).json({
      success: false,
      message: 'Tanggal akhir (end_date) tidak boleh lebih awal dari tanggal mulai (start_date).',
    });
  }

  // Lookup supplier
  const supplier = db.prepare(`
    SELECT * FROM suppliers 
    WHERE id = ? OR LOWER(name) = ? OR LOWER(penerima) = ? OR LOWER(idProgram) = ?
  `).get(supplier_id, supplier_id.toLowerCase(), supplier_id.toLowerCase(), supplier_id.toLowerCase());

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: `Supplier dengan ID / Nama '${supplier_id}' tidak ditemukan.`,
    });
  }

  // Query transactions from BKK
  const transactions = db.prepare(`
    SELECT * FROM bkk
    WHERE (
      LOWER(perusahaan) = LOWER(?) OR 
      LOWER(penerima) = LOWER(?) OR 
      LOWER(perusahaan) LIKE ? OR
      LOWER(penerima) LIKE ?
    )
    AND tanggal >= ? AND tanggal <= ?
    ORDER BY tanggal DESC, id DESC
  `).all(
    supplier.name,
    supplier.penerima,
    `%${supplier.name.toLowerCase()}%`,
    `%${supplier.penerima.toLowerCase()}%`,
    start_date,
    end_date
  );

  const totalRitase = transactions.reduce((acc, t) => acc + (Number(t.ritaseCount) || 1), 0);
  const totalVolume = transactions.reduce((acc, t) => acc + (Number(t.kubikasi || t.volume) || 0), 0);
  const totalAmount = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalLunas = transactions
    .filter((t) => t.statusBayar === 'Lunas')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalBelumLunas = totalAmount - totalLunas;

  res.json({
    success: true,
    data: {
      supplier,
      transactions,
    },
    summary: {
      totalRitase,
      totalVolume,
      totalAmount,
      totalLunas,
      totalBelumLunas,
      totalTransactions: transactions.length,
    },
    filters: {
      supplier_id,
      start_date,
      end_date,
    },
  });
});

// Start listening
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[PT BAS Backend] Node.js Server running on port ${PORT}`);
    console.log(`[PT BAS Database] SQLite database connected: server/data/ptbas.db`);
  });
}

export default app;


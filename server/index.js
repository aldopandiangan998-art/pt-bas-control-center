import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import db, { initDb } from './db.js';

// Initialize SQLite database
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare('SELECT id, name, email, password, role, roleLabel, branch, phone, birth_date, gender, aktif FROM users WHERE LOWER(email) = ?')
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
  const { name, phone, birth_date, gender } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  db.prepare(`
    UPDATE users
    SET name = ?, phone = ?, birth_date = ?, gender = ?
    WHERE id = ?
  `).run(name.trim(), phone || '-', birth_date || null, gender || 'Laki-laki', id);

  const updatedUser = db
    .prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at FROM users WHERE id = ?')
    .get(id);

  res.json({
    success: true,
    message: 'Profil akun berhasil diperbarui.',
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
  const users = db.prepare('SELECT id, name, email, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
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
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }
  if (user.role === 'superadmin') {
    return res.status(400).json({ success: false, message: 'Akun Super Admin tidak dapat dihapus.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
});

// ==========================================
// MASTER DATA ROUTES
// ==========================================

// 1. Materials
app.get('/api/master/materials', (req, res) => {
  const materials = db.prepare('SELECT * FROM materials ORDER BY name ASC').all();
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

// ==========================================
// TRANSACTIONS ROUTES
// ==========================================

// Pre Orders
app.get('/api/pre-orders', (req, res) => {
  const pos = db.prepare('SELECT * FROM pre_orders ORDER BY id DESC').all();
  res.json(pos);
});

app.post('/api/pre-orders', (req, res) => {
  const { customer, customerAddress, materialId, materialName, materialCategory, pphRate, satuan, totalOrder, hargaJual, hargaBeli, tanggal, top } = req.body;
  const id = `PO-DRAFT-${Date.now()}`;

  db.prepare(`
    INSERT INTO pre_orders (id, nomorPo, customer, customerAddress, materialId, materialName, materialCategory, pphRate, satuan, totalOrder, terkirim, hargaJual, hargaBeli, tanggal, top, status, createdBy, approvedBy, approvedAt)
    VALUES (?, null, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'MENUNGGU_APPROVAL', 'Admin Gresik', null, null)
  `).run(id, customer, customerAddress, materialId, materialName, materialCategory, pphRate, satuan, totalOrder, hargaJual, hargaBeli, tanggal, top);

  res.status(201).json({ success: true, id });
});

app.patch('/api/pre-orders/:id/approve', (req, res) => {
  const { approver = 'David Rusiah (Direktur)' } = req.body;
  const now = new Date().toISOString();
  db.prepare('UPDATE pre_orders SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?')
    .run('APPROVED', approver, now, req.params.id);
  res.json({ success: true });
});

app.patch('/api/pre-orders/:id/reject', (req, res) => {
  const { reason = 'Margin di bawah batas minimum' } = req.body;
  db.prepare('UPDATE pre_orders SET status = ?, rejectionReason = ? WHERE id = ?')
    .run('REJECTED', reason, req.params.id);
  res.json({ success: true });
});

// Surat Jalan
app.get('/api/surat-jalan', (req, res) => {
  const sjs = db.prepare('SELECT * FROM surat_jalan ORDER BY id DESC').all();
  res.json(sjs);
});

app.post('/api/surat-jalan', (req, res) => {
  const { nomorSj, poNumber, customer, material, nopol, driver, tanggal, waktu, nomorNota, isPpn, panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir } = req.body;
  const id = `SJ-${Date.now()}`;

  db.prepare(`
    INSERT INTO surat_jalan (id, nomorSj, poNumber, customer, material, nopol, driver, tanggal, waktu, nomorNota, isPpn, panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Selesai')
  `).run(id, nomorSj, poNumber, customer, material, nopol, driver, tanggal, waktu, nomorNota, isPpn ? 1 : 0, panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir);

  res.status(201).json({ success: true, id });
});

// BKK
app.get('/api/bkk', (req, res) => {
  const bkks = db.prepare('SELECT * FROM bkk ORDER BY id DESC').all();
  res.json(bkks);
});

app.patch('/api/bkk/pay', (req, res) => {
  const { ids, tanggalBayar = new Date().toISOString().split('T')[0] } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'IDs array required' });

  for (const id of ids) {
    db.prepare('UPDATE bkk SET statusBayar = ?, tanggalBayar = ? WHERE id = ?')
      .run('Lunas', tanggalBayar, id);
  }

  res.json({ success: true, count: ids.length });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[PT BAS Backend] Node.js Server running on port ${PORT}`);
  console.log(`[PT BAS Database] SQLite database connected: server/data/ptbas.db`);
});


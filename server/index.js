import express from 'express';
import cors from 'cors';
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

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db
    .prepare('SELECT id, name, email, password, role, roleLabel, branch, phone, aktif FROM users WHERE LOWER(email) = ?')
    .get(cleanEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Email atau kata sandi tidak valid. Pastikan data akun benar.',
    });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'admin', branch = 'Hub Gresik', phone = '-' } = req.body;

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

  const validRole = role === 'superadmin' ? 'superadmin' : 'admin';
  const roleLabel = validRole === 'superadmin' ? 'Super Admin' : 'Admin';
  const id = `usr-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password, role, roleLabel, branch, phone, aktif, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, name.trim(), cleanEmail, password, validRole, roleLabel, branch, phone, now);

  const newUser = {
    id,
    name: name.trim(),
    email: cleanEmail,
    role: validRole,
    roleLabel,
    branch,
    phone,
    aktif: 1,
    created_at: now,
  };

  res.status(201).json({ success: true, user: newUser });
});

// Get all users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, roleLabel, branch, phone, aktif, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
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

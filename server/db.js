import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ptbas.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance concurrency
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize Database Schema
 */
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      roleLabel TEXT,
      branch TEXT,
      phone TEXT,
      aktif INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      idProgram TEXT,
      penerima TEXT,
      telepon TEXT,
      pkp INTEGER DEFAULT 1,
      bank TEXT,
      noRekening TEXT,
      rekeningAtasNama TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      pphRate REAL,
      defaultUnit TEXT,
      beli REAL,
      jual REAL,
      coa TEXT,
      coaPiutang TEXT,
      coaPendapatan TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      alias TEXT,
      badanUsaha TEXT,
      alamat TEXT,
      npwp TEXT,
      telepon TEXT,
      kodePrefix TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS armada (
      id TEXT PRIMARY KEY,
      nopol TEXT NOT NULL,
      panjangCm REAL,
      lebarCm REAL,
      tinggiCm REAL,
      merk TEXT,
      vin TEXT,
      mesin TEXT,
      tahun INTEGER,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pre_orders (
      id TEXT PRIMARY KEY,
      nomorPo TEXT,
      customer TEXT,
      customerAddress TEXT,
      materialId TEXT,
      materialName TEXT,
      materialCategory TEXT,
      pphRate REAL,
      satuan TEXT,
      totalOrder REAL,
      terkirim REAL,
      hargaJual REAL,
      hargaBeli REAL,
      tanggal TEXT,
      top TEXT,
      status TEXT,
      createdBy TEXT,
      approvedBy TEXT,
      approvedAt TEXT,
      rejectionReason TEXT
    );

    CREATE TABLE IF NOT EXISTS surat_jalan (
      id TEXT PRIMARY KEY,
      nomorSj TEXT NOT NULL,
      poNumber TEXT,
      customer TEXT,
      material TEXT,
      nopol TEXT,
      driver TEXT,
      tanggal TEXT,
      waktu TEXT,
      nomorNota TEXT,
      isPpn INTEGER DEFAULT 0,
      panjangCm REAL,
      lebarCm REAL,
      tinggiCm REAL,
      koreksiTinggiCm REAL,
      volumeAkhir REAL,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS bkk (
      id TEXT PRIMARY KEY,
      kodeTransaksi TEXT,
      tanggal TEXT,
      perusahaan TEXT,
      material TEXT,
      ritaseCount INTEGER,
      kubikasi REAL,
      hargaSatuan REAL,
      amount REAL,
      statusBayar TEXT,
      tanggalBayar TEXT,
      rekeningTujuan TEXT,
      penerima TEXT
    );
  `);

  seedInitialData();
}

/**
 * Seed Initial Records if empty
 */
function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, roleLabel, branch, phone, aktif, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    insertUser.run(
      'usr-1',
      'David Rusiah',
      'superadmin@ptbas.co.id',
      'superadmin123',
      'superadmin',
      'Super Admin',
      'Pusat & Hub Gresik',
      '0811-3001-992',
      new Date().toISOString()
    );

    insertUser.run(
      'usr-2',
      'Rudi Hartono',
      'admin@ptbas.co.id',
      'admin123',
      'admin',
      'Admin',
      'Hub Gresik',
      '0813-8899-112',
      new Date().toISOString()
    );
  }

  // Seed materials if empty
  const matCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (matCount === 0) {
    const insertMat = db.prepare(`
      INSERT INTO materials (id, name, category, pphRate, defaultUnit, beli, jual, coa, coaPiutang, coaPendapatan, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const defaultMats = [
      ['mat-1', 'BASE COURSE', 'Padat', 2.65, 'm3', 40000, 50000, '110-90', '112-10', '410-10'],
      ['mat-2', 'BATU BOULDER', 'Padat', 2.65, 'm3', 32580, 45800, '110-91', '112-10', '410-10'],
      ['mat-3', 'JASA ANGKUT', 'Jasa', 2.0, 'rit', 20408, 20408, '510-10', '112-10', '410-20'],
      ['mat-4', 'LIMESTONE', 'Padat', 2.65, 'm3', 38991, 42857, '110-92', '112-10', '410-10'],
      ['mat-5', 'PARAS', 'Curah', 2.0, 'm3', 41000, 45000, '110-93', '112-10', '410-10'],
      ['mat-6', 'PASIR', 'Curah', 2.0, 'm3', 40000, 50000, '110-94', '112-10', '410-10'],
      ['mat-7', 'PAVING STONE', 'Padat', 2.65, 'm2', 71000, 76000, '110-95', '112-10', '410-10'],
      ['mat-8', 'SIRTU', 'Curah', 2.0, 'm3', 50765, 67233, '110-96', '112-10', '410-10'],
      ['mat-9', 'SIRTU AYAK', 'Curah', 2.0, 'm3', 25000, 37000, '110-97', '112-10', '410-10'],
    ];

    for (const m of defaultMats) {
      insertMat.run(...m);
    }
  }

  // Seed suppliers if empty
  const supCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  if (supCount === 0) {
    const insertSup = db.prepare(`
      INSERT INTO suppliers (id, name, idProgram, penerima, telepon, pkp, bank, noRekening, rekeningAtasNama, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertSup.run('sup-1', 'UKHY DIAN', 'SUP-001', 'UKHY DIAN', '0812-3456-7890', 1, 'BCA', '6150832452', 'UKHY DIAN');
    insertSup.run('sup-2', 'PT. TENANG JAYA SEJAHTERA', 'SUP-002', 'ARIF NURCAHYADI', '0811-9876-5432', 1, 'BCA', '0503800800', 'ARIF NURCAHYADI');
    insertSup.run('sup-3', 'PT SOYO APIK', 'SUP-003', 'PT SOYO APIK', '0821-3344-5566', 1, 'BCA', '829-189-1888', 'PT SOYO APIK');
    insertSup.run('sup-4', 'PAK TEGUH (BARU)', 'SUP-004', 'EKO WAHYUDI PRAYOGO', '0857-1122-3344', 0, 'BCA', '7415250533', 'EKO WAHYUDI PRAYOGO');
    insertSup.run('sup-5', 'PAK TEGUH', 'SUP-005', 'EKO WAHYUDI PRAYOGO', '0857-1122-3345', 0, 'BCA', '7415094256', 'EKO WAHYUDI PRAYOGO');
  }

  // Seed armada if empty
  const armCount = db.prepare('SELECT COUNT(*) as count FROM armada').get().count;
  if (armCount === 0) {
    const insertArm = db.prepare(`
      INSERT INTO armada (id, nopol, panjangCm, lebarCm, tinggiCm, merk, vin, mesin, tahun, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertArm.run('arm-1', '21606', 650, 250, 200, 'Hino Ranger 500', 'VIN-882109', 'J08E-882', 2022);
    insertArm.run('arm-2', 'A9041ZN', 788, 250, 210, 'Mitsubishi Fuso Fighter', 'VIN-772910', '6M60-771', 2021);
    insertArm.run('arm-3', 'A9048NM', 630, 235, 180, 'Isuzu Giga FVR', 'VIN-661209', '6HK1-662', 2023);
    insertArm.run('arm-4', 'A9248NM', 630, 235, 180, 'Isuzu Giga FVR', 'VIN-661210', '6HK1-663', 2023);
    insertArm.run('arm-5', 'AA1253AE', 625, 235, 175, 'Hino Dutro HD', 'VIN-551029', 'W04D-551', 2020);
    insertArm.run('arm-6', 'W 9821 UB', 650, 250, 200, 'Hino Ranger 500', 'VIN-990123', 'J08E-991', 2023);
  }

  // Seed customers if empty
  const custCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (custCount === 0) {
    const insertCust = db.prepare(`
      INSERT INTO customers (id, name, alias, badanUsaha, alamat, npwp, telepon, kodePrefix, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertCust.run('cust-1', 'PT LION WINGS', 'LION', 'PT', 'Kawasan Industri Gresik (KIG) Blok C-12, Manyar, Gresik', '01.234.567.8-012.000', '031-3981234', 'LW');
    insertCust.run('cust-2', 'PT SEMEN INDONESIA', 'SMN', 'PT', 'Jl. Veteran, Gresik', '01.987.654.3-098.000', '031-3985678', 'SI');
    insertCust.run('cust-3', 'PT SOLUSI BANGUN INDONESIA', 'SBI', 'PT', 'Tuban Quarry Complex', '02.345.678.9-023.000', '0356-321456', 'SBI');
    insertCust.run('cust-4', 'PT PETROKIMIA GRESIK', 'PG', 'PT', 'Jl. Jenderal Ahmad Yani, Gresik', '01.111.222.3-011.000', '031-3982200', 'PG');
  }

  // Seed pre_orders if empty
  const poCount = db.prepare('SELECT COUNT(*) as count FROM pre_orders').get().count;
  if (poCount === 0) {
    const insertPo = db.prepare(`
      INSERT INTO pre_orders (id, nomorPo, customer, customerAddress, materialId, materialName, materialCategory, pphRate, satuan, totalOrder, terkirim, hargaJual, hargaBeli, tanggal, top, status, createdBy, approvedBy, approvedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPo.run('PO-DRAFT-01', 'PO-LW-2026-089', 'PT LION WINGS', 'Kawasan Industri Gresik Blok C-12', 'mat-8', 'SIRTU', 'Curah', 2.0, 'm3', 500, 161.43, 67233, 50765, '2026-11-01', '30 Hari', 'APPROVED', 'Admin Gresik', 'David Rusiah (Direktur)', '2026-11-01 10:30');
    insertPo.run('PO-DRAFT-02', null, 'PT SEMEN INDONESIA', 'Jl. Veteran, Gresik', 'mat-4', 'LIMESTONE', 'Padat', 2.65, 'm3', 1200, 0, 42857, 38991, '2026-11-10', '14 Hari', 'MENUNGGU_APPROVAL', 'Admin Gresik', null, null);
    insertPo.run('PO-DRAFT-03', 'PO-PG-2026-041', 'PT PETROKIMIA GRESIK', 'Jl. Jenderal Ahmad Yani, Gresik', 'mat-6', 'PASIR', 'Curah', 2.0, 'rit', 150, 45, 50000, 40000, '2026-11-04', 'Cash / Tunai', 'APPROVED', 'Admin Gresik', 'David Rusiah (Direktur)', '2026-11-04 14:10');
  }

  // Seed surat_jalan if empty
  const sjCount = db.prepare('SELECT COUNT(*) as count FROM surat_jalan').get().count;
  if (sjCount === 0) {
    const insertSj = db.prepare(`
      INSERT INTO surat_jalan (id, nomorSj, poNumber, customer, material, nopol, driver, tanggal, waktu, nomorNota, isPpn, panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSj.run('SJ-202611-0089', '29678', 'PO-LW-2026-089', 'PT LION WINGS', 'SIRTU', 'W 9821 UB', 'Bambang Suprianto', '2026-11-07', '09:43', 'NT-88921', 0, 650, 250, 200, 0, 32.5, 'Selesai');
    insertSj.run('SJ-202611-0090', '29679', 'PO-LW-2026-089', 'PT LION WINGS', 'SIRTU', 'A9041ZN', 'Supriyadi', '2026-11-07', '11:15', 'NT-88922', 0, 788, 250, 210, -5, 40.39, 'Selesai');
    insertSj.run('SJ-202611-0091', '29680', 'PO-LW-2026-089', 'PT LION WINGS', 'SIRTU', 'A9048NM', 'Mulyono', '2026-11-07', '13:05', 'NT-88923', 0, 630, 235, 180, 0, 26.65, 'Selesai');
  }

  // Seed bkk if empty
  const bkkCount = db.prepare('SELECT COUNT(*) as count FROM bkk').get().count;
  if (bkkCount === 0) {
    const insertBkk = db.prepare(`
      INSERT INTO bkk (id, kodeTransaksi, tanggal, perusahaan, material, ritaseCount, kubikasi, hargaSatuan, amount, statusBayar, tanggalBayar, rekeningTujuan, penerima)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBkk.run('bkk-1', 'TRX-202611-001', '2026-11-07', 'UKHY DIAN', 'SIRTU (Curah)', 1, 32.5, 50765, 1649863, 'Belum Dibayar', null, 'BCA 6150832452', 'UKHY DIAN');
    insertBkk.run('bkk-2', 'TRX-202611-002', '2026-11-07', 'PT TENANG JAYA SEJAHTERA', 'SIRTU (Curah)', 1, 40.39, 50765, 2050400, 'Belum Dibayar', null, 'BCA 0503800800', 'ARIF NURCAHYADI');
    insertBkk.run('bkk-3', 'TRX-202611-003', '2026-11-07', 'PT SOYO APIK', 'SIRTU (Curah)', 1, 26.65, 50765, 1352887, 'Belum Dibayar', null, 'BCA 829-189-1888', 'PT SOYO APIK');
  }
}

export default db;

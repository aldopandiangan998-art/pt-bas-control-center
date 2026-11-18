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
      birth_date TEXT,
      gender TEXT,
      reset_token TEXT,
      reset_token_expires INTEGER,
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
      terkirim REAL DEFAULT 0,
      hargaJual REAL,
      hargaBeli REAL,
      tanggal TEXT,
      top TEXT,
      status TEXT DEFAULT 'MENUNGGU_APPROVAL',
      createdBy TEXT,
      approvedBy TEXT,
      approvedAt TEXT,
      rejectionReason TEXT,
      items TEXT,
      nomorRO TEXT,
      jenisRO TEXT,
      jenis TEXT,
      mataUang TEXT,
      jenisWajibPajak TEXT,
      nomorPoCustomer TEXT,
      hubungkanNomorPoMaterial TEXT,
      satuanJasaAngkut TEXT
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

    CREATE TABLE IF NOT EXISTS jurnal_gi (
      id TEXT PRIMARY KEY,
      nomorRO TEXT NOT NULL,
      preOrderId TEXT,
      poNumber TEXT,
      customer TEXT NOT NULL,
      customerAddress TEXT,
      material TEXT NOT NULL,
      isPpn INTEGER DEFAULT 0,
      tanggal TEXT,
      totalSj INTEGER DEFAULT 0,
      targetRitase INTEGER DEFAULT 0,
      totalVolume REAL DEFAULT 0,
      targetVolume REAL DEFAULT 0,
      satuan TEXT DEFAULT 'm3',
      hargaBeli REAL DEFAULT 0,
      hargaJual REAL DEFAULT 0,
      nominalBeli REAL DEFAULT 0,
      nominalJual REAL DEFAULT 0,
      status TEXT DEFAULT 'Siap Kirim',
      suratJalanDetails TEXT DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT
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

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      namaBank TEXT NOT NULL,
      namaAlias TEXT,
      kodeSwift TEXT,
      kodeBank TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      bank TEXT NOT NULL,
      jenisRekening TEXT,
      nomorRekening TEXT NOT NULL,
      rekeningAtasNama TEXT NOT NULL,
      namaAlias TEXT,
      supplierId TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      isoCode TEXT,
      name TEXT NOT NULL,
      englishName TEXT,
      symbol TEXT,
      country TEXT,
      pemisahRibuan TEXT,
      pemisahDesimal TEXT,
      formatSample TEXT,
      presisi TEXT,
      formatPresisi TEXT,
      pajak TEXT,
      isBase INTEGER DEFAULT 0,
      deskripsi TEXT,
      lingkupModul TEXT,
      aktif INTEGER DEFAULT 1
    );
  `);

  // Safe migration for user profile & password reset fields
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const cols = tableInfo.map((c) => c.name);
    if (!cols.includes('birth_date')) {
      db.exec('ALTER TABLE users ADD COLUMN birth_date TEXT;');
    }
    if (!cols.includes('gender')) {
      db.exec('ALTER TABLE users ADD COLUMN gender TEXT;');
    }
    if (!cols.includes('reset_token')) {
      db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT;');
    }
    if (!cols.includes('reset_token_expires')) {
      db.exec('ALTER TABLE users ADD COLUMN reset_token_expires INTEGER;');
    }
  } catch (err) {
    console.warn('Migration users table error:', err);
  }

  // Safe migration for pre_orders additional fields
  try {
    const poCols = db.prepare('PRAGMA table_info(pre_orders)').all().map((c) => c.name);
    const newPoCols = [
      ['items', 'TEXT'],
      ['nomorRO', 'TEXT'],
      ['jenisRO', 'TEXT'],
      ['jenis', 'TEXT'],
      ['mataUang', 'TEXT'],
      ['jenisWajibPajak', 'TEXT'],
      ['nomorPoCustomer', 'TEXT'],
      ['hubungkanNomorPoMaterial', 'TEXT'],
      ['satuanJasaAngkut', 'TEXT'],
    ];
    for (const [col, colType] of newPoCols) {
      if (!poCols.includes(col)) {
        db.exec(`ALTER TABLE pre_orders ADD COLUMN ${col} ${colType};`);
      }
    }
  } catch (err) {
    console.warn('Migration pre_orders table error:', err);
  }

  // Safe migration for materials table (itemType and materialId mapping)
  try {
    const matCols = db.prepare('PRAGMA table_info(materials)').all().map((c) => c.name);
    if (!matCols.includes('itemType')) {
      db.exec("ALTER TABLE materials ADD COLUMN itemType TEXT DEFAULT 'MATERIAL';");
    }
    if (!matCols.includes('materialId')) {
      db.exec('ALTER TABLE materials ADD COLUMN materialId TEXT;');
    }

    // Set itemType = 'JASA_ANGKUT' for service items and link default materialId
    db.prepare(`
      UPDATE materials
      SET itemType = 'JASA_ANGKUT', materialId = COALESCE(materialId, 'mat-8'), defaultUnit = ''
      WHERE category = 'Jasa' OR UPPER(name) LIKE '%JASA ANGKUT%'
    `).run();

    // Ensure all other items have itemType = 'MATERIAL'
    db.prepare(`
      UPDATE materials
      SET itemType = 'MATERIAL'
      WHERE category != 'Jasa' AND UPPER(name) NOT LIKE '%JASA ANGKUT%' AND (itemType IS NULL OR itemType = '')
    `).run();
  } catch (err) {
    console.warn('Migration materials table error:', err);
  }

  seedInitialData();
}

/**
 * Seed Initial Records if empty
 */
function seedInitialData() {
  const initialUsers = [
    {
      id: 'usr-1',
      name: 'David Rusiah',
      email: 'superadmin@ptbas.co.id',
      password: 'superadmin123',
      role: 'superadmin',
      roleLabel: 'Super Admin',
      branch: 'Pusat & Hub Gresik',
      phone: '0811-3001-992',
      birth_date: '1985-06-15',
      gender: 'Laki-laki',
    },
    {
      id: 'usr-2',
      name: 'Rudi Hartono',
      email: 'admin@ptbas.co.id',
      password: 'admin123',
      role: 'admin',
      roleLabel: 'Admin',
      branch: 'Hub Gresik',
      phone: '0813-8899-112',
      birth_date: '1992-04-10',
      gender: 'Laki-laki',
    },
  ];

  // Purge any dummy admin user if previously seeded
  try {
    db.prepare("DELETE FROM users WHERE id = 'usr-3' OR LOWER(email) = 'admin.dummy@ptbas.co.id'").run();
  } catch (e) {}

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, roleLabel, branch, phone, birth_date, gender, aktif, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const u of initialUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(u.email.toLowerCase());
    if (!existing) {
      insertUser.run(
        u.id,
        u.name,
        u.email.toLowerCase(),
        u.password,
        u.role,
        u.roleLabel,
        u.branch,
        u.phone,
        u.birth_date,
        u.gender,
        new Date().toISOString()
      );
    }
  }

  // Ensure default superadmin has birth_date and gender populated
  try {
    db.prepare(`
      UPDATE users 
      SET birth_date = '1985-06-15', gender = 'Laki-laki' 
      WHERE role = 'superadmin' AND (birth_date IS NULL OR gender IS NULL OR birth_date = '')
    `).run();
  } catch (e) {
    // ignore
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

  // Pre-orders are not seeded with dummy records, started clean for real admin input

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

  // Seed jurnal_gi if empty
  const jrnCount = db.prepare('SELECT COUNT(*) as count FROM jurnal_gi').get().count;
  if (jrnCount === 0) {
    const insertJrn = db.prepare(`
      INSERT INTO jurnal_gi (
        id, nomorRO, preOrderId, poNumber, customer, customerAddress, material,
        isPpn, tanggal, totalSj, targetRitase, totalVolume, targetVolume, satuan,
        hargaBeli, hargaJual, nominalBeli, nominalJual, status, suratJalanDetails,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sjDetailsLW = [
      {
        id: 'SJ-202611-0089',
        nomorSj: '29678',
        poNumber: 'PO-LW-2026-089',
        customer: 'PT LION WINGS',
        material: 'SIRTU',
        nopol: 'W 9821 UB',
        driver: 'Bambang Suprianto',
        tanggal: '2026-11-07',
        waktu: '09:43',
        nomorNota: 'NT-88921',
        panjangCm: 650,
        lebarCm: 250,
        tinggiCm: 200,
        koreksiTinggiCm: 0,
        volumeAkhir: 32.5,
        status: 'Selesai'
      },
      {
        id: 'SJ-202611-0090',
        nomorSj: '29679',
        poNumber: 'PO-LW-2026-089',
        customer: 'PT LION WINGS',
        material: 'SIRTU',
        nopol: 'A9041ZN',
        driver: 'Supriyadi',
        tanggal: '2026-11-07',
        waktu: '11:15',
        nomorNota: 'NT-88922',
        panjangCm: 788,
        lebarCm: 250,
        tinggiCm: 210,
        koreksiTinggiCm: -5,
        volumeAkhir: 40.39,
        status: 'Selesai'
      },
      {
        id: 'SJ-202611-0091',
        nomorSj: '29680',
        poNumber: 'PO-LW-2026-089',
        customer: 'PT LION WINGS',
        material: 'SIRTU',
        nopol: 'A9048NM',
        driver: 'Mulyono',
        tanggal: '2026-11-07',
        waktu: '13:05',
        nomorNota: 'NT-88923',
        panjangCm: 630,
        lebarCm: 235,
        tinggiCm: 180,
        koreksiTinggiCm: 0,
        volumeAkhir: 26.65,
        status: 'Selesai'
      }
    ];

    insertJrn.run(
      'REK-202611-0001',
      'RO-2026-0089',
      'PO-DRAFT-01',
      'PO-LW-2026-089',
      'PT LION WINGS',
      'Kawasan Industri Gresik Blok C-12',
      'SIRTU',
      0,
      '2026-11-07',
      3,
      15,
      99.54,
      500,
      'm3',
      50765,
      67233,
      5053148,
      6692373,
      'Siap Tagih',
      JSON.stringify(sjDetailsLW),
      '2026-11-01 10:30:00',
      '2026-11-07 13:05:00'
    );

    insertJrn.run(
      'REK-202611-0002',
      'RO-2026-0090',
      'PO-DRAFT-02',
      'PO-SI-2026-014',
      'PT SEMEN INDONESIA',
      'Jl. Veteran, Gresik',
      'LIMESTONE',
      1,
      '2026-11-10',
      0,
      30,
      0,
      1200,
      'm3',
      38991,
      42857,
      0,
      0,
      'Siap Kirim',
      JSON.stringify([]),
      '2026-11-10 09:00:00',
      '2026-11-10 09:00:00'
    );
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

  // Seed banks if empty
  const bankCount = db.prepare('SELECT COUNT(*) as count FROM banks').get().count;
  if (bankCount === 0) {
    const insertBank = db.prepare(`
      INSERT INTO banks (id, namaBank, namaAlias, kodeSwift, kodeBank, aktif)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertBank.run('bank-1', 'Bank Central Asia', 'BCA', 'CENAIDJA', '014');
    insertBank.run('bank-2', 'Bank Mandiri', 'Mandiri', 'BMRIIDJA', '008');
    insertBank.run('bank-3', 'Bank Rakyat Indonesia', 'BRI', 'BRINIDJA', '002');
    insertBank.run('bank-4', 'Bank Negara Indonesia', 'BNI', 'BNINIDJA', '009');
  }

  // Seed bank_accounts if empty
  const accCount = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count;
  if (accCount === 0) {
    const insertAcc = db.prepare(`
      INSERT INTO bank_accounts (id, bank, jenisRekening, nomorRekening, rekeningAtasNama, namaAlias, supplierId, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertAcc.run('acc-1', 'BCA', 'Giro Bisnis', '0188920199', 'PT Berkah Alam Semesta', 'BCA Operasional Gresik', null);
    insertAcc.run('acc-2', 'Bank Mandiri', 'Giro Utama', '1420019283741', 'PT Berkah Alam Semesta', 'Mandiri Penerimaan Proyek', null);
    insertAcc.run('acc-3', 'Bank Central Asia', 'Tabungan Escrow', '0503800800', 'PT Berkah Alam Semesta', 'BCA Cadangan Kas Supplier', null);
  }

  // Seed currencies if empty
  const currCount = db.prepare('SELECT COUNT(*) as count FROM currencies').get().count;
  if (currCount === 0) {
    const insertCurr = db.prepare(`
      INSERT INTO currencies (id, code, isoCode, name, englishName, symbol, country, pemisahRibuan, pemisahDesimal, formatSample, presisi, formatPresisi, pajak, isBase, deskripsi, lingkupModul, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCurr.run(
      'curr-idr',
      'IDR',
      '360',
      'Rupiah Indonesia',
      'Indonesian Rupiah',
      'Rp',
      'Indonesia (Bank Indonesia)',
      'Titik (.)',
      'Koma (,)',
      'Rp 18.712.800,00',
      '2 Digit Koma',
      '24,50 m³',
      'PPN 11% & PPh 22 (0.25% - 1.5%)',
      1,
      'Mata uang basis resmi pembukuan akuntansi, buku besar (GL), kas operasional (BKK), dan faktur customer PT BAS.',
      JSON.stringify(['Buku Besar (GL)', 'BKK (Cash Out)', 'Faktur Invoice', 'Surat Jalan', 'RO']),
      1
    );

    insertCurr.run(
      'curr-usd',
      'USD',
      '840',
      'Dolar Amerika Serikat',
      'United States Dollar',
      '$',
      'Amerika Serikat (Federal Reserve)',
      'Koma (,)',
      'Titik (.)',
      '$ 1,250.00',
      '2 Digit Desimal',
      '24.50 m³',
      'Non-PPN / Transaksi Valas',
      0,
      'Valuta asing pendukung untuk kontrak pengadaan material internasional dan order customer berbasis Dolar AS.',
      JSON.stringify(['Pre Order Customer', 'Kontrak Vendor Valas']),
      1
    );

    insertCurr.run(
      'curr-eur',
      'EUR',
      '978',
      'Euro Uni Eropa',
      'Euro',
      '€',
      'Uni Eropa (European Central Bank)',
      'Titik (.)',
      'Koma (,)',
      '€ 1.100,00',
      '2 Digit Desimal',
      '24,50 m³',
      'Non-PPN / Transaksi Valas',
      0,
      'Valuta asing cadangan untuk impor suku cadang dump truck dan mesin pemecah batu (stone crusher).',
      JSON.stringify(['Pengadaan Suku Cadang Alat']),
      0
    );
  }

  // Seed pre_orders if empty
  const poCount = db.prepare('SELECT COUNT(*) as count FROM pre_orders').get().count;
  if (poCount === 0) {
    const insertPo = db.prepare(`
      INSERT INTO pre_orders (
        id, nomorPo, customer, customerAddress, materialId, materialName, materialCategory,
        pphRate, satuan, totalOrder, terkirim, hargaJual, hargaBeli, tanggal, top,
        status, createdBy, approvedBy, approvedAt, rejectionReason, items,
        nomorRO, jenisRO, jenis, mataUang, jenisWajibPajak, nomorPoCustomer, hubungkanNomorPoMaterial
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialROs = [
      {
        id: 'RO-LW-655-4590011130',
        nomorRO: 'LW 655 - CUR - 4590011130',
        nomorPo: '4590011130',
        customer: 'LION WINGS, PT',
        customerAddress: 'Kawasan Industri Gresik Blok C-12',
        materialId: 'mat-8',
        materialName: 'SIRTU',
        materialCategory: 'Curah',
        pphRate: 2.0,
        satuan: 'm³',
        totalOrder: 2278.00,
        terkirim: 0,
        hargaJual: 78000,
        hargaBeli: 120000,
        tanggal: '2026-10-12',
        top: '14 hari',
        status: 'APPROVED',
        createdBy: 'Admin Hub Gresik',
        approvedBy: 'David Rusiah (Super Admin)',
        approvedAt: '2026-10-12 10:00:00',
        items: JSON.stringify([{ id: 'it-1', nama: 'SIRTU', kuantitas: 2278, satuan: 'm³', hargaBeli: 120000, hargaJual: 78000 }]),
        jenisRO: 'JASA ANGKUT + MATERIAL',
        jenis: 'CURAH',
        mataUang: 'IDR',
        jenisWajibPajak: 'PKP',
        nomorPoCustomer: '4590011130',
        hubungkanNomorPoMaterial: '4590011130'
      },
      {
        id: 'RO-WS-576-4510010537',
        nomorRO: 'WS 576 - CUR - 4510010537',
        nomorPo: '4510010537',
        customer: 'WINGS SURYA, PT',
        customerAddress: 'Jl. Rungkut Industri III, Surabaya',
        materialId: 'mat-8',
        materialName: 'SIRTU',
        materialCategory: 'Curah',
        pphRate: 2.0,
        satuan: 'm³',
        totalOrder: 450.00,
        terkirim: 0,
        hargaJual: 78000,
        hargaBeli: 101000,
        tanggal: '2026-10-09',
        top: '14 hari',
        status: 'APPROVED',
        createdBy: 'Admin Hub Gresik',
        approvedBy: 'David Rusiah (Super Admin)',
        approvedAt: '2026-10-09 11:30:00',
        items: JSON.stringify([{ id: 'it-2', nama: 'SIRTU', kuantitas: 450, satuan: 'm³', hargaBeli: 101000, hargaJual: 78000 }]),
        jenisRO: 'JASA ANGKUT + MATERIAL',
        jenis: 'CURAH',
        mataUang: 'IDR',
        jenisWajibPajak: 'PKP',
        nomorPoCustomer: '4510010537',
        hubungkanNomorPoMaterial: '4510010537'
      },
      {
        id: 'RO-KIAS-004-POS-2608-000224',
        nomorRO: 'KIAS 004 - CUR - POS-2608-000224',
        nomorPo: 'POS-2608-000224',
        customer: 'KARYA INDAH ALAM SEJAHTERA, PT',
        customerAddress: 'Jl. Raya Manyar Km. 11, Gresik',
        materialId: 'mat-8',
        materialName: 'SIRTU',
        materialCategory: 'Curah',
        pphRate: 2.0,
        satuan: 'm³',
        totalOrder: 11045.00,
        terkirim: 0,
        hargaJual: 78000,
        hargaBeli: 120000,
        tanggal: '2026-08-19',
        top: '14 hari',
        status: 'APPROVED',
        createdBy: 'Admin Hub Gresik',
        approvedBy: 'David Rusiah (Super Admin)',
        approvedAt: '2026-08-19 09:15:00',
        items: JSON.stringify([{ id: 'it-3', nama: 'SIRTU', kuantitas: 11045, satuan: 'm³', hargaBeli: 120000, hargaJual: 78000 }]),
        jenisRO: 'JASA ANGKUT + MATERIAL',
        jenis: 'CURAH',
        mataUang: 'IDR',
        jenisWajibPajak: 'PKP',
        nomorPoCustomer: 'POS-2608-000224',
        hubungkanNomorPoMaterial: 'POS-2608-000224'
      },
      {
        id: 'RO-SAS-965-4500005548',
        nomorRO: 'SAS 965 - CUR - 4500005548',
        nomorPo: '4500005548',
        customer: 'SEHAT ALAM SEGAR, PT',
        customerAddress: 'Kawasan Industri Gresik Kav. 8-10',
        materialId: 'mat-8',
        materialName: 'SIRTU',
        materialCategory: 'Curah',
        pphRate: 2.0,
        satuan: 'm³',
        totalOrder: 1137.00,
        terkirim: 0,
        hargaJual: 78000,
        hargaBeli: 120000,
        tanggal: '2026-08-04',
        top: '14 hari',
        status: 'APPROVED',
        createdBy: 'Admin Hub Gresik',
        approvedBy: 'David Rusiah (Super Admin)',
        approvedAt: '2026-08-04 14:20:00',
        items: JSON.stringify([{ id: 'it-4', nama: 'SIRTU', kuantitas: 1137, satuan: 'm³', hargaBeli: 120000, hargaJual: 78000 }]),
        jenisRO: 'JASA ANGKUT + MATERIAL',
        jenis: 'CURAH',
        mataUang: 'IDR',
        jenisWajibPajak: 'PKP',
        nomorPoCustomer: '4500005548',
        hubungkanNomorPoMaterial: '4500005548'
      }
    ];

    for (const r of initialROs) {
      insertPo.run(
        r.id,
        r.nomorPo,
        r.customer,
        r.customerAddress,
        r.materialId,
        r.materialName,
        r.materialCategory,
        r.pphRate,
        r.satuan,
        r.totalOrder,
        r.terkirim,
        r.hargaJual,
        r.hargaBeli,
        r.tanggal,
        r.top,
        r.status,
        r.createdBy,
        r.approvedBy,
        r.approvedAt,
        null,
        r.items,
        r.nomorRO,
        r.jenisRO,
        r.jenis,
        r.mataUang,
        r.jenisWajibPajak,
        r.nomorPoCustomer,
        r.hubungkanNomorPoMaterial
      );
    }
  }
}

export default db;


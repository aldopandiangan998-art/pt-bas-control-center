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
      hubungkanNomorPoMaterial TEXT
    );

    CREATE TABLE IF NOT EXISTS surat_jalan (
      id TEXT PRIMARY KEY,
      nomorSj TEXT NOT NULL,
      poNumber TEXT,
      nomorRO TEXT,
      jurnalId TEXT,
      preOrderId TEXT,
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
    ];
    for (const [col, colType] of newPoCols) {
      if (!poCols.includes(col)) {
        db.exec(`ALTER TABLE pre_orders ADD COLUMN ${col} ${colType};`);
      }
    }
  } catch (err) {
    console.warn('Migration pre_orders table error:', err);
  }

  // Safe migration for surat_jalan additional relation fields
  try {
    const sjCols = db.prepare('PRAGMA table_info(surat_jalan)').all().map((c) => c.name);
    const newSjCols = [
      ['nomorRO', 'TEXT'],
      ['jurnalId', 'TEXT'],
      ['preOrderId', 'TEXT'],
    ];
    for (const [col, colType] of newSjCols) {
      if (!sjCols.includes(col)) {
        db.exec(`ALTER TABLE surat_jalan ADD COLUMN ${col} ${colType};`);
      }
    }
  } catch (err) {
    console.warn('Migration surat_jalan table error:', err);
  }

  seedInitialData();
  syncJournalsAndWaybills();
}

/**
 * Synchronize approved Pre Orders to Jurnal GI and link all Surat Jalan waybills.
 * Strictly purges any orphan journal or waybill data not matching the Pre Orders page.
 */
export function syncJournalsAndWaybills() {
  try {
    // 0. PURGE ORPHAN DATA: Delete any journal summaries or waybills not tied to real Pre Orders
    db.exec(`
      DELETE FROM jurnal_gi
      WHERE (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM pre_orders))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM pre_orders WHERE nomorRO IS NOT NULL)))
         OR id IN ('REK-202611-0001', 'REK-202611-0002')
         OR poNumber IN ('PO-LW-2026-089', 'PO-SI-2026-014', 'PO-DRAFT-01', 'PO-DRAFT-02');

      DELETE FROM surat_jalan
      WHERE (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM pre_orders))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM pre_orders WHERE nomorRO IS NOT NULL)))
         OR id IN ('SJ-202611-0089', 'SJ-202611-0090', 'SJ-202611-0091')
         OR poNumber IN ('PO-LW-2026-089', 'PO-SI-2026-014', 'PO-DRAFT-01', 'PO-DRAFT-02');
    `);

    // 1. Ensure all APPROVED Pre Orders have a nomorRO and an active Jurnal GI summary record
    const approvedPos = db.prepare("SELECT * FROM pre_orders WHERE status = 'APPROVED'").all();
    for (const po of approvedPos) {
      let nomorRO = po.nomorRO;
      if (!nomorRO) {
        const year = po.tanggal ? String(po.tanggal).slice(0, 4) : String(new Date().getFullYear());
        nomorRO = `RO-${year}-${String(po.id).slice(-4)}`;
        db.prepare('UPDATE pre_orders SET nomorRO = ? WHERE id = ?').run(nomorRO, po.id);
        po.nomorRO = nomorRO;
      }

      let jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE preOrderId = ? OR nomorRO = ?').get(po.id, nomorRO);
      if (!jurnal) {
        const jrnId = `REK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;
        let parsedItems = [];
        if (po.items) {
          try { parsedItems = JSON.parse(po.items); } catch (e) { parsedItems = []; }
        }
        const firstItem = parsedItems[0] || {};
        const matName = po.materialName || firstItem.nama || 'SIRTU';
        const targetVol = Number(po.totalOrder || firstItem.kuantitas || 0);
        const hBeli = Number(po.hargaBeli || firstItem.hargaBeli || 0);
        const hJual = Number(po.hargaJual || firstItem.hargaJual || 0);
        const isPpn = po.jenisWajibPajak === 'PKP' ? 1 : 0;
        const targetTrips = po.satuan === 'rit' ? Math.max(1, targetVol) : Math.max(1, Math.ceil(targetVol / 30));
        const nowIso = new Date().toISOString();

        db.prepare(`
          INSERT INTO jurnal_gi (
            id, nomorRO, preOrderId, poNumber, customer, customerAddress,
            material, isPpn, tanggal, totalSj, targetRitase, totalVolume,
            targetVolume, satuan, hargaBeli, hargaJual, nominalBeli,
            nominalJual, status, suratJalanDetails, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          jrnId,
          nomorRO,
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
      }
    }

    // 2. Synchronize waybills (surat_jalan) to their respective Jurnal GI summaries
    const allSj = db.prepare('SELECT * FROM surat_jalan').all();
    for (const sj of allSj) {
      let po = null;
      if (sj.preOrderId) {
        po = db.prepare('SELECT * FROM pre_orders WHERE id = ?').get(sj.preOrderId);
      }
      if (!po && sj.poNumber) {
        po = db.prepare('SELECT * FROM pre_orders WHERE nomorPo = ? OR id = ?').get(sj.poNumber, sj.poNumber);
      }
      if (!po && sj.nomorRO) {
        po = db.prepare('SELECT * FROM pre_orders WHERE nomorRO = ?').get(sj.nomorRO);
      }

      let jurnal = null;
      if (sj.jurnalId) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(sj.jurnalId);
      }
      if (!jurnal && po) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE preOrderId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(po.id, po.nomorRO || '');
      }
      if (!jurnal && sj.nomorRO) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE nomorRO = ?').get(sj.nomorRO);
      }
      if (!jurnal && sj.poNumber) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE poNumber = ?').get(sj.poNumber);
      }

      if (jurnal) {
        // Ensure relational pointers on surat_jalan
        if (!sj.jurnalId || !sj.nomorRO || !sj.preOrderId) {
          db.prepare('UPDATE surat_jalan SET nomorRO = ?, jurnalId = ?, preOrderId = ? WHERE id = ?').run(
            jurnal.nomorRO,
            jurnal.id,
            jurnal.preOrderId || po?.id || null,
            sj.id
          );
        }

        // Parse details and append if missing
        let details = [];
        try {
          details = typeof jurnal.suratJalanDetails === 'string' ? JSON.parse(jurnal.suratJalanDetails) : (jurnal.suratJalanDetails || []);
        } catch (e) {
          details = [];
        }

        const exists = details.some((d) => d.id === sj.id || d.nomorSj === sj.nomorSj);
        if (!exists) {
          const sjDesc = {
            id: sj.id,
            nomorSj: sj.nomorSj,
            poNumber: sj.poNumber || jurnal.poNumber,
            nomorRO: jurnal.nomorRO,
            customer: sj.customer || jurnal.customer,
            material: sj.material || jurnal.material,
            nopol: sj.nopol || 'W 9821 UB',
            driver: sj.driver || 'Supir Armada Terjadwal',
            tanggal: sj.tanggal,
            waktu: sj.waktu,
            nomorNota: sj.nomorNota || '',
            panjangCm: sj.panjangCm || 0,
            lebarCm: sj.lebarCm || 0,
            tinggiCm: sj.tinggiCm || 0,
            koreksiTinggiCm: sj.koreksiTinggiCm || 0,
            volumeAkhir: Number(sj.volumeAkhir) || 0,
            status: sj.status || 'Selesai',
          };
          details.push(sjDesc);

          const totalSj = details.length;
          const totalVolume = Number(details.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2));
          const nominalBeli = Math.round(totalVolume * (Number(jurnal.hargaBeli) || 0));
          const nominalJual = Math.round(totalVolume * (Number(jurnal.hargaJual) || 0));
          const targetTrips = Number(jurnal.targetRitase) || 0;
          const targetVol = Number(jurnal.targetVolume) || 0;
          const isTripsMet = targetTrips > 0 && totalSj >= targetTrips;
          const isVolumeMet = targetVol > 0 && totalVolume >= targetVol;
          const status = (isTripsMet || isVolumeMet) ? 'Selesai Kirim' : 'Dalam Pengiriman';

          db.prepare(`
            UPDATE jurnal_gi
            SET totalSj = ?, totalVolume = ?, nominalBeli = ?, nominalJual = ?,
                status = ?, suratJalanDetails = ?, updated_at = ?
            WHERE id = ?
          `).run(
            totalSj,
            totalVolume,
            nominalBeli,
            nominalJual,
            status,
            JSON.stringify(details),
            new Date().toISOString(),
            jurnal.id
          );

          if (po) {
            db.prepare('UPDATE pre_orders SET terkirim = ? WHERE id = ?').run(totalVolume, po.id);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error during syncJournalsAndWaybills:', err);
  }
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

  // Pre-orders, Surat Jalan, and Jurnal GI are NOT seeded with dummy records
  // They are strictly populated from real administrative transactions and synchronized


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
}

export default db;


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

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      kodeTransaksi TEXT,
      nomorInvoice TEXT,
      nomorFakturPajak TEXT,
      tanggal TEXT NOT NULL,
      customer TEXT NOT NULL,
      customerId TEXT,
      npwp TEXT,
      material TEXT,
      materialType TEXT,
      volume REAL DEFAULT 0,
      satuan TEXT DEFAULT 'm3',
      hargaSatuan REAL DEFAULT 0,
      dpp REAL DEFAULT 0,
      tarifPpn REAL DEFAULT 11,
      ppn REAL DEFAULT 0,
      tarifPph REAL DEFAULT 0,
      pph REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      statusBayar TEXT DEFAULT 'Belum Dibayar',
      statusFaktur TEXT DEFAULT 'APPROVED DJP',
      poNumber TEXT,
      nomorRO TEXT,
      periode TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS pph23_records (
      id TEXT PRIMARY KEY,
      tanggal TEXT NOT NULL,
      noBuktiPotong TEXT NOT NULL,
      noBkk TEXT,
      bkkId TEXT,
      vendor TEXT NOT NULL,
      vendorId TEXT,
      npwpNik TEXT,
      objekPajak TEXT,
      kategori TEXT,
      tarif REAL DEFAULT 2.0,
      dpp REAL DEFAULT 0,
      potonganPph REAL DEFAULT 0,
      nettoBkk REAL DEFAULT 0,
      statusBupot TEXT DEFAULT 'TERBIT',
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_tanggal ON invoices(tanggal);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer);
    CREATE INDEX IF NOT EXISTS idx_pph23_tanggal ON pph23_records(tanggal);
    CREATE INDEX IF NOT EXISTS idx_bkk_tanggal ON bkk(tanggal);
    CREATE INDEX IF NOT EXISTS idx_bkk_perusahaan ON bkk(perusahaan);
    CREATE INDEX IF NOT EXISTS idx_preorders_customer ON pre_orders(customer);
    CREATE INDEX IF NOT EXISTS idx_preorders_ro ON pre_orders(nomorRO);
    CREATE INDEX IF NOT EXISTS idx_suratjalan_customer ON surat_jalan(customer);
    CREATE INDEX IF NOT EXISTS idx_suratjalan_ro ON surat_jalan(nomorRO);
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
  ];

  // Purge any dummy admin user if previously seeded & sanitize any malformed branch
  try {
    db.prepare("DELETE FROM users WHERE id IN ('usr-2', 'usr-3') OR LOWER(email) IN ('admin@ptbas.co.id', 'admin.dummy@ptbas.co.id')").run();
    db.prepare("UPDATE users SET branch = 'Hub Gresik' WHERE branch LIKE '%Site [%' OR branch LIKE '%// Tgl:%'").run();
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

  // Seed invoices if empty
  const invCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
  if (invCount === 0) {
    const insertInv = db.prepare(`
      INSERT INTO invoices (
        id, kodeTransaksi, nomorInvoice, nomorFakturPajak, tanggal,
        customer, customerId, npwp, material, materialType,
        volume, satuan, hargaSatuan, dpp, tarifPpn, ppn,
        tarifPph, pph, amount, statusBayar, statusFaktur,
        poNumber, nomorRO, periode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialInvoices = [
      {
        id: 'PPN-202611-001',
        kodeTransaksi: 'INV/BAS/2026/11/001',
        nomorInvoice: 'INV/BAS/2026/11/001',
        nomorFakturPajak: '010.002-26.00000089',
        tanggal: '2026-11-12',
        customer: 'PT CHIYODA INTERNATIONAL INDONESIA',
        customerId: 'cust-chiyoda',
        npwp: '01.345.678.9-054.000',
        material: 'Batu Split 1-2 (Proyek Smelter Freeport)',
        materialType: 'Padat',
        volume: 250,
        satuan: 'm3',
        hargaSatuan: 170000,
        dpp: 42500000,
        tarifPpn: 11,
        ppn: 4675000,
        tarifPph: 2.65,
        pph: 1126250,
        amount: 47175000,
        statusBayar: 'Lunas',
        statusFaktur: 'APPROVED DJP',
        poNumber: 'PO-CHIYODA-2026',
        nomorRO: 'RO-2026-CH-01',
        periode: 'November 2026',
        created_at: '2026-11-12 10:00:00'
      },
      {
        id: 'PPN-202611-002',
        kodeTransaksi: 'INV/BAS/2026/11/002',
        nomorInvoice: 'INV/BAS/2026/11/002',
        nomorFakturPajak: '010.002-26.00000090',
        tanggal: '2026-11-10',
        customer: 'PT WASKITA BETON PRECAST TBK',
        customerId: 'cust-waskita',
        npwp: '01.889.123.4-051.000',
        material: 'Sirtu Urug Pilihan (Tol KLBM Ruas Bunder)',
        materialType: 'Curah',
        volume: 380,
        satuan: 'm3',
        hargaSatuan: 100000,
        dpp: 38000000,
        tarifPpn: 11,
        ppn: 4180000,
        tarifPph: 2.0,
        pph: 760000,
        amount: 42180000,
        statusBayar: 'Belum Dibayar',
        statusFaktur: 'APPROVED DJP',
        poNumber: 'PO-WASKITA-2026',
        nomorRO: 'RO-2026-WB-02',
        periode: 'November 2026',
        created_at: '2026-11-10 14:30:00'
      },
      {
        id: 'PPN-202611-003',
        kodeTransaksi: 'INV/BAS/2026/11/003',
        nomorInvoice: 'INV/BAS/2026/11/003',
        nomorFakturPajak: '010.002-26.00000091',
        tanggal: '2026-11-08',
        customer: 'PT SEMEN INDONESIA (PERSERO) TBK',
        customerId: 'cust-si',
        npwp: '01.001.654.2-052.000',
        material: 'Limestone Super Cor (Tuban Hub)',
        materialType: 'Padat',
        volume: 245,
        satuan: 'm3',
        hargaSatuan: 100000,
        dpp: 24500000,
        tarifPpn: 11,
        ppn: 2695000,
        tarifPph: 2.65,
        pph: 649250,
        amount: 27195000,
        statusBayar: 'Lunas',
        statusFaktur: 'APPROVED DJP',
        poNumber: 'PO-SI-2026',
        nomorRO: 'RO-2026-SI-03',
        periode: 'November 2026',
        created_at: '2026-11-08 09:15:00'
      },
      {
        id: 'PPN-202611-004',
        kodeTransaksi: 'INV/BAS/2026/11/004',
        nomorInvoice: 'INV/BAS/2026/11/004',
        nomorFakturPajak: '010.002-26.00000092',
        tanggal: '2026-11-05',
        customer: 'LION WINGS, PT',
        customerId: 'cust-1',
        npwp: '01.222.333.4-053.000',
        material: 'Sirtu Curah Cuci (Pondasi KIG)',
        materialType: 'Curah',
        volume: 220,
        satuan: 'm3',
        hargaSatuan: 88053,
        dpp: 19371600,
        tarifPpn: 11,
        ppn: 2130876,
        tarifPph: 2.0,
        pph: 387432,
        amount: 21502476,
        statusBayar: 'Belum Dibayar',
        statusFaktur: 'APPROVED DJP',
        poNumber: '4590011130',
        nomorRO: 'LW 655 - CUR - 4590011130',
        periode: 'November 2026',
        created_at: '2026-11-05 11:20:00'
      },
      {
        id: 'PPN-202611-005',
        kodeTransaksi: 'INV/BAS/2026/11/005',
        nomorInvoice: 'INV/BAS/2026/11/005',
        nomorFakturPajak: '010.002-26.00000093',
        tanggal: '2026-11-03',
        customer: 'WINGS SURYA, PT',
        customerId: 'cust-2',
        npwp: '01.777.888.9-055.000',
        material: 'Base Course A (Dermaga Pelabuhan Manyar)',
        materialType: 'Padat',
        volume: 100,
        satuan: 'm3',
        hargaSatuan: 82000,
        dpp: 8200000,
        tarifPpn: 11,
        ppn: 902000,
        tarifPph: 2.65,
        pph: 217300,
        amount: 9102000,
        statusBayar: 'Lunas',
        statusFaktur: 'APPROVED DJP',
        poNumber: '4510010537',
        nomorRO: 'WS 576 - CUR - 4510010537',
        periode: 'November 2026',
        created_at: '2026-11-03 15:45:00'
      },
      {
        id: 'PPN-202610-006',
        kodeTransaksi: '4590011130 - INV - C3DBN',
        nomorInvoice: 'INV/BAS/2026/10/012',
        nomorFakturPajak: '010.002-26.00000078',
        tanggal: '2026-10-29',
        customer: 'LION WINGS, PT',
        customerId: 'cust-1',
        npwp: '01.222.333.4-053.000',
        material: 'SIRTU',
        materialType: 'Curah',
        volume: 550.54,
        satuan: 'm3',
        hargaSatuan: 121588,
        dpp: 66939176,
        tarifPpn: 11,
        ppn: 7363310,
        tarifPph: 2.0,
        pph: 1338784,
        amount: 74302486,
        statusBayar: 'Belum Dibayar',
        statusFaktur: 'APPROVED DJP',
        poNumber: '4590011130',
        nomorRO: 'LW 655 - CUR - 4590011130',
        periode: 'Oktober 2026',
        created_at: '2026-10-29 11:44:00'
      },
      {
        id: 'PPN-202610-007',
        kodeTransaksi: '4510010537 - INV - L5CGP',
        nomorInvoice: 'INV/BAS/2026/10/010',
        nomorFakturPajak: '010.002-26.00000075',
        tanggal: '2026-10-22',
        customer: 'WINGS SURYA, PT',
        customerId: 'cust-2',
        npwp: '01.777.888.9-055.000',
        material: 'SIRTU',
        materialType: 'Curah',
        volume: 376.43,
        satuan: 'm3',
        hargaSatuan: 104052,
        dpp: 39168658,
        tarifPpn: 11,
        ppn: 4308552,
        tarifPph: 2.0,
        pph: 783373,
        amount: 43477210,
        statusBayar: 'Belum Dibayar',
        statusFaktur: 'APPROVED DJP',
        poNumber: '4510010537',
        nomorRO: 'WS 576 - CUR - 4510010537',
        periode: 'Oktober 2026',
        created_at: '2026-10-22 12:21:00'
      }
    ];

    for (const inv of initialInvoices) {
      insertInv.run(
        inv.id, inv.kodeTransaksi, inv.nomorInvoice, inv.nomorFakturPajak, inv.tanggal,
        inv.customer, inv.customerId, inv.npwp, inv.material, inv.materialType,
        inv.volume, inv.satuan, inv.hargaSatuan, inv.dpp, inv.tarifPpn, inv.ppn,
        inv.tarifPph, inv.pph, inv.amount, inv.statusBayar, inv.statusFaktur,
        inv.poNumber, inv.nomorRO, inv.periode, inv.created_at
      );
    }
  }

  // Seed pph23_records if empty
  const pphCount = db.prepare('SELECT COUNT(*) as count FROM pph23_records').get().count;
  if (pphCount === 0) {
    const insertPph = db.prepare(`
      INSERT INTO pph23_records (
        id, tanggal, noBuktiPotong, noBkk, bkkId, vendor, vendorId,
        npwpNik, objekPajak, kategori, tarif, dpp, potonganPph, nettoBkk, statusBupot, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialPph = [
      {
        id: 'PPH-202611-001',
        tanggal: '2026-11-11',
        noBuktiPotong: 'BUPOT-23/BAS/2026/11/001',
        noBkk: 'BKK/2026/11/0042',
        bkkId: 'bkk-1',
        vendor: 'UKHY DIAN',
        vendorId: 'sup-1',
        npwpNik: '3525011204850003',
        objekPajak: 'Jasa Angkut Material Tambang',
        kategori: 'Jasa Angkut (2.0%)',
        tarif: 2.0,
        dpp: 15407100,
        potonganPph: 308142,
        nettoBkk: 15098958,
        statusBupot: 'TERBIT',
        created_at: '2026-11-11 10:00:00'
      },
      {
        id: 'PPH-202611-002',
        tanggal: '2026-11-09',
        noBuktiPotong: 'BUPOT-23/BAS/2026/11/002',
        noBkk: 'BKK/2026/11/0043',
        bkkId: 'bkk-2',
        vendor: 'PT. TENANG JAYA SEJAHTERA',
        vendorId: 'sup-2',
        npwpNik: '02.451.980.1-604.000',
        objekPajak: 'Bahan Galian Non-Logam (Limestone Padat)',
        kategori: 'Galian Tambang Padat (2.65%)',
        tarif: 2.65,
        dpp: 22800000,
        potonganPph: 604200,
        nettoBkk: 22195800,
        statusBupot: 'TERBIT',
        created_at: '2026-11-09 11:30:00'
      },
      {
        id: 'PPH-202611-003',
        tanggal: '2026-11-07',
        noBuktiPotong: 'BUPOT-23/BAS/2026/11/003',
        noBkk: 'BKK/2026/11/0044',
        bkkId: 'bkk-3',
        vendor: 'PT SOYO APIK',
        vendorId: 'sup-3',
        npwpNik: '03.112.445.6-601.000',
        objekPajak: 'Jasa Angkut Sirtu Gresik-Manyar',
        kategori: 'Jasa Angkut (2.0%)',
        tarif: 2.0,
        dpp: 18416450,
        potonganPph: 368329,
        nettoBkk: 18048121,
        statusBupot: 'TERBIT',
        created_at: '2026-11-07 14:15:00'
      },
      {
        id: 'PPH-202611-004',
        tanggal: '2026-11-05',
        noBuktiPotong: 'BUPOT-23/BAS/2026/11/004',
        noBkk: 'BKK/2026/11/0045',
        bkkId: 'bkk-4',
        vendor: 'PAK TEGUH (BARU)',
        vendorId: 'sup-4',
        npwpNik: '01.992.331.0-602.000',
        objekPajak: 'Batu Boulder Pondasi (Tambang Padat)',
        kategori: 'Galian Tambang Padat (2.65%)',
        tarif: 2.65,
        dpp: 12500000,
        potonganPph: 331250,
        nettoBkk: 12168750,
        statusBupot: 'TERBIT',
        created_at: '2026-11-05 16:00:00'
      },
      {
        id: 'PPH-202611-005',
        tanggal: '2026-11-02',
        noBuktiPotong: 'BUPOT-23/BAS/2026/11/005',
        noBkk: 'BKK/2026/11/0046',
        bkkId: 'bkk-5',
        vendor: 'UKHY DIAN',
        vendorId: 'sup-1',
        npwpNik: '3525041008800002',
        objekPajak: 'Jasa Angkut Abu Batu Tuban-Gresik',
        kategori: 'Jasa Angkut (2.0%)',
        tarif: 2.0,
        dpp: 7800000,
        potonganPph: 156000,
        nettoBkk: 7644000,
        statusBupot: 'TERBIT',
        created_at: '2026-11-02 09:40:00'
      },
      {
        id: 'PPH-202610-006',
        tanggal: '2026-10-25',
        noBuktiPotong: 'BUPOT-23/BAS/2026/10/012',
        noBkk: 'BKK/2026/10/0038',
        bkkId: 'bkk-6',
        vendor: 'PAK TEGUH',
        vendorId: 'sup-5',
        npwpNik: '01.992.331.0-602.000',
        objekPajak: 'Sirtu Urug (Galian Curah)',
        kategori: 'Galian Tambang Curah (2.0%)',
        tarif: 2.0,
        dpp: 16200000,
        potonganPph: 324000,
        nettoBkk: 15876000,
        statusBupot: 'TERBIT',
        created_at: '2026-10-25 13:10:00'
      }
    ];

    for (const p of initialPph) {
      insertPph.run(
        p.id, p.tanggal, p.noBuktiPotong, p.noBkk, p.bkkId, p.vendor, p.vendorId,
        p.npwpNik, p.objekPajak, p.kategori, p.tarif, p.dpp, p.potonganPph, p.nettoBkk, p.statusBupot, p.created_at
      );
    }
  }

  // Ensure BKK has additional supplier records for supplier reporting
  const moreBkk = [
    {
      id: 'bkk-4',
      kodeTransaksi: 'TRX-202611-004',
      tanggal: '2026-11-05',
      perusahaan: 'UKHY DIAN',
      material: 'SIRTU (Curah)',
      ritaseCount: 2,
      kubikasi: 58.4,
      hargaSatuan: 50765,
      amount: 2964676,
      statusBayar: 'Lunas',
      tanggalBayar: '2026-11-06',
      rekeningTujuan: 'BCA 6150832452',
      penerima: 'UKHY DIAN'
    },
    {
      id: 'bkk-5',
      kodeTransaksi: 'TRX-202611-005',
      tanggal: '2026-11-09',
      perusahaan: 'PT. TENANG JAYA SEJAHTERA',
      material: 'LIMESTONE (Padat)',
      ritaseCount: 3,
      kubikasi: 85.0,
      hargaSatuan: 38991,
      amount: 3314235,
      statusBayar: 'Lunas',
      tanggalBayar: '2026-11-10',
      rekeningTujuan: 'BCA 0503800800',
      penerima: 'ARIF NURCAHYADI'
    },
    {
      id: 'bkk-6',
      kodeTransaksi: 'TRX-202611-006',
      tanggal: '2026-11-11',
      perusahaan: 'PT SOYO APIK',
      material: 'SIRTU (Curah)',
      ritaseCount: 2,
      kubikasi: 60.12,
      hargaSatuan: 50765,
      amount: 3051992,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningTujuan: 'BCA 829-189-1888',
      penerima: 'PT SOYO APIK'
    },
    {
      id: 'bkk-7',
      kodeTransaksi: 'TRX-202610-007',
      tanggal: '2026-10-25',
      perusahaan: 'PAK TEGUH',
      material: 'BASE COURSE (Padat)',
      ritaseCount: 4,
      kubikasi: 110.5,
      hargaSatuan: 40000,
      amount: 4420000,
      statusBayar: 'Lunas',
      tanggalBayar: '2026-10-26',
      rekeningTujuan: 'BCA 7415094256',
      penerima: 'EKO WAHYUDI PRAYOGO'
    },
    {
      id: 'bkk-8',
      kodeTransaksi: 'TRX-202611-008',
      tanggal: '2026-11-14',
      perusahaan: 'PAK TEGUH (BARU)',
      material: 'BATU BOULDER (Padat)',
      ritaseCount: 2,
      kubikasi: 64.2,
      hargaSatuan: 32580,
      amount: 2091636,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningTujuan: 'BCA 7415250533',
      penerima: 'EKO WAHYUDI PRAYOGO'
    }
  ];

  const insertBkkStmt = db.prepare(`
    INSERT INTO bkk (id, kodeTransaksi, tanggal, perusahaan, material, ritaseCount, kubikasi, hargaSatuan, amount, statusBayar, tanggalBayar, rekeningTujuan, penerima)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const b of moreBkk) {
    const exists = db.prepare('SELECT id FROM bkk WHERE id = ?').get(b.id);
    if (!exists) {
      insertBkkStmt.run(b.id, b.kodeTransaksi, b.tanggal, b.perusahaan, b.material, b.ritaseCount, b.kubikasi, b.hargaSatuan, b.amount, b.statusBayar, b.tanggalBayar, b.rekeningTujuan, b.penerima);
    }
  }
}

export default db;


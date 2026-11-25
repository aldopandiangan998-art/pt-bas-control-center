import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { aggregateJournalWaybills } from './journalUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/data and server/data/uploads/bkk directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
export const bkkUploadsDir = path.join(dataDir, 'uploads', 'bkk');
if (!fs.existsSync(bkkUploadsDir)) {
  fs.mkdirSync(bkkUploadsDir, { recursive: true });
}
export const invoiceUploadsDir = path.join(dataDir, 'uploads', 'invoices');
if (!fs.existsSync(invoiceUploadsDir)) {
  fs.mkdirSync(invoiceUploadsDir, { recursive: true });
}

const dbPath = process.env.PTBAS_DB_PATH ? path.resolve(process.env.PTBAS_DB_PATH) : path.join(dataDir, 'ptbas.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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
      avatar TEXT,
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

    CREATE TABLE IF NOT EXISTS received_order (
      id BIGINT PRIMARY KEY,
      nomorPo VARCHAR(50) DEFAULT NULL,
      customer TEXT,
      customerAddress TEXT,
      customerId TEXT,
      supplierId TEXT,
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
      nomorPoCustomer VARCHAR(50) DEFAULT NULL,
      hubungkanNomorPoMaterial VARCHAR(50) DEFAULT NULL,
      satuanJasaAngkut TEXT,
      poUpdatedBy TEXT,
      poUpdatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS surat_jalan (
      id BIGINT PRIMARY KEY,
      poNumber VARCHAR(50) DEFAULT NULL,
      nomorRO BIGINT,
      jurnalId TEXT,
      preOrderId BIGINT,
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
      preOrderId BIGINT,
      poNumber VARCHAR(50) DEFAULT NULL,
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
      kodeTransaksi TEXT NOT NULL,
      nomorRO TEXT,
      preOrderId BIGINT,
      jurnalId TEXT,
      poNumber VARCHAR(50) DEFAULT NULL,
      supplierId TEXT,
      customerId TEXT,
      perusahaan TEXT NOT NULL,
      subDetail TEXT,
      penerima TEXT,
      material TEXT,
      jenis TEXT,
      ritaseCount INTEGER DEFAULT 0,
      kubikasi REAL DEFAULT 0,
      volume REAL DEFAULT 0,
      satuan TEXT DEFAULT 'm3',
      hargaSatuan REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      statusBayar TEXT DEFAULT 'Belum Dibayar',
      status TEXT DEFAULT 'MENUNGGU_APPROVAL',
      createdBy TEXT,
      approvedBy TEXT,
      approvedAt TEXT,
      rejectionReason TEXT,
      tanggal TEXT,
      timestamp TEXT,
      periode TEXT,
      tanggalBayar TEXT,
      rekeningSumber TEXT,
      rekeningTujuan TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      kodeTransaksi TEXT NOT NULL,
      nomorInvoice TEXT,
      nomorFakturPajak TEXT,
      nomorRO TEXT,
      preOrderId BIGINT,
      jurnalId TEXT,
      poNumber VARCHAR(50) DEFAULT NULL,
      customerId TEXT,
      supplierId TEXT,
      perusahaan TEXT,
      customer TEXT,
      customerAddress TEXT,
      npwp TEXT,
      material TEXT,
      materialType TEXT,
      jenis TEXT,
      volume REAL DEFAULT 0,
      satuan TEXT DEFAULT 'm3',
      hargaSatuan REAL DEFAULT 0,
      subtotalJasa REAL DEFAULT 0,
      dpp REAL DEFAULT 0,
      tarifPpn REAL DEFAULT 11,
      ppnNominal REAL DEFAULT 0,
      ppn REAL DEFAULT 0,
      tarifPph REAL DEFAULT 0,
      pphNominal REAL DEFAULT 0,
      pph REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      statusBayar TEXT DEFAULT 'Belum Dibayar',
      statusFaktur TEXT DEFAULT 'APPROVED DJP',
      tanggal TEXT,
      waktu TEXT,
      timestamp TEXT,
      periode TEXT,
      tanggalBayar TEXT,
      kirimKeRekening TEXT,
      rekeningAtasNama TEXT,
      created_at TEXT,
      updated_at TEXT
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
    CREATE TABLE IF NOT EXISTS pph21_records (
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
      tarif REAL DEFAULT 2.5,
      dpp REAL DEFAULT 0,
      potonganPph REAL DEFAULT 0,
      nettoBkk REAL DEFAULT 0,
      statusBupot TEXT DEFAULT 'TERBIT',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bkk_documents (
      id TEXT PRIMARY KEY,
      bkkId TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      fileName TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      fileType TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      uploadedBy TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      verifiedBy TEXT,
      verifiedAt TEXT,
      rejectionReason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bkk_audit_logs (
      id TEXT PRIMARY KEY,
      bkkId TEXT NOT NULL,
      action TEXT NOT NULL,
      actorId TEXT,
      actorName TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_documents (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      fileName TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      fileType TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      uploadedBy TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      verifiedBy TEXT,
      verifiedAt TEXT,
      rejectionReason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_audit_logs (
      id TEXT PRIMARY KEY,
      invoiceId TEXT NOT NULL,
      action TEXT NOT NULL,
      actorId TEXT,
      actorName TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplier_materials (
      id TEXT PRIMARY KEY,
      supplierId TEXT NOT NULL,
      materialId TEXT NOT NULL,
      hargaBeliDefault REAL DEFAULT 0,
      aktif INTEGER DEFAULT 1,
      created_at TEXT,
      UNIQUE(supplierId, materialId)
    );

    CREATE TABLE IF NOT EXISTS jurnal_audit_logs (
      id TEXT PRIMARY KEY,
      jurnalId TEXT NOT NULL,
      action TEXT NOT NULL,
      actorId TEXT,
      actorName TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      reason TEXT,
      details TEXT,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
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
    if (!cols.includes('avatar')) {
      db.exec('ALTER TABLE users ADD COLUMN avatar TEXT;');
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

  // Safe migration: unify legacy pre_orders table into received_order
  try {
    const roCols = db.prepare('PRAGMA table_info(received_order)').all().map((c) => c.name);
    const newPoCols = [
      ['items', 'TEXT'],
      ['nomorRO', 'TEXT'],
      ['jenisRO', 'TEXT'],
      ['jenis', 'TEXT'],
      ['mataUang', 'TEXT'],
      ['jenisWajibPajak', 'TEXT'],
      ['nomorPoCustomer', 'VARCHAR(50) DEFAULT NULL'],
      ['hubungkanNomorPoMaterial', 'VARCHAR(50) DEFAULT NULL'],
      ['satuanJasaAngkut', 'TEXT'],
      ['customerId', 'TEXT'],
      ['supplierId', 'TEXT'],
      ['poUpdatedBy', 'TEXT'],
      ['poUpdatedAt', 'TEXT'],
    ];
    for (const [col, colType] of newPoCols) {
      if (!roCols.includes(col)) {
        db.exec(`ALTER TABLE received_order ADD COLUMN ${col} ${colType};`);
      }
    }

    const isPoTable = db.prepare("SELECT type, name FROM sqlite_master WHERE type='table' AND name='pre_orders'").get();
    if (isPoTable) {
      const targetCols = db.prepare('PRAGMA table_info(received_order)').all().map((c) => c.name);
      const sourceCols = db.prepare('PRAGMA table_info(pre_orders)').all().map((c) => c.name);
      const sharedCols = sourceCols.filter((c) => targetCols.includes(c));
      if (sharedCols.length > 0) {
        const colList = sharedCols.join(', ');
        db.exec(`INSERT OR IGNORE INTO received_order (${colList}) SELECT ${colList} FROM pre_orders;`);
      }
      db.exec(`
        DROP INDEX IF EXISTS idx_preorders_customer;
        DROP INDEX IF EXISTS idx_preorders_ro;
        DROP TABLE pre_orders;
      `);
    }

    db.exec(`
      CREATE VIEW IF NOT EXISTS pre_orders AS SELECT * FROM received_order;
      CREATE INDEX IF NOT EXISTS idx_received_order_nomor_ro ON received_order (nomorRO);
      CREATE INDEX IF NOT EXISTS idx_received_order_nomor_po ON received_order (nomorPo);
      CREATE INDEX IF NOT EXISTS idx_received_order_customer ON received_order (customer);
    `);
  } catch (err) {
    console.warn('Migration received_order table error:', err);
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

  // Safe migration for surat_jalan BIGINT id
  try {
    const sjInfo = db.prepare('PRAGMA table_info(surat_jalan)').all();
    const sjIdCol = sjInfo.find((c) => c.name === 'id');
    const sjRoCol = sjInfo.find((c) => c.name === 'nomorRO');
    if ((sjIdCol && sjIdCol.type !== 'BIGINT') || (sjRoCol && sjRoCol.type !== 'BIGINT')) {
      const oldSj = db.prepare('SELECT * FROM surat_jalan').all();
      db.exec(`
        CREATE TABLE surat_jalan_migrated (
          id BIGINT PRIMARY KEY,
          poNumber VARCHAR(50) DEFAULT NULL,
          nomorRO BIGINT,
          jurnalId TEXT,
          preOrderId BIGINT,
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
      `);

      for (const sj of oldSj) {
        db.prepare(`
          INSERT INTO surat_jalan_migrated (
            id, poNumber, nomorRO, jurnalId, preOrderId, customer,
            material, nopol, driver, tanggal, waktu, nomorNota, isPpn,
            panjangCm, lebarCm, tinggiCm, koreksiTinggiCm, volumeAkhir, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          Number(sj.id), sj.poNumber, sj.nomorRO, sj.jurnalId, sj.preOrderId ? Number(sj.preOrderId) : null, sj.customer,
          sj.material, sj.nopol, sj.driver, sj.tanggal, sj.waktu, sj.nomorNota, sj.isPpn,
          sj.panjangCm, sj.lebarCm, sj.tinggiCm, sj.koreksiTinggiCm, sj.volumeAkhir, sj.status
        );
      }

      db.exec('DROP TABLE surat_jalan;');
      db.exec('ALTER TABLE surat_jalan_migrated RENAME TO surat_jalan;');
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_suratjalan_customer ON surat_jalan(customer);
        CREATE INDEX IF NOT EXISTS idx_suratjalan_ro ON surat_jalan(nomorRO);
      `);
    }

    // Ensure BIGINT autoincrement fallback triggers exist
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_surat_jalan_id
      AFTER INSERT ON surat_jalan
      WHEN new.id IS NULL
      BEGIN
        UPDATE surat_jalan
        SET id = (SELECT COALESCE(MAX(id), 0) + 1 FROM surat_jalan)
        WHERE rowid = new.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS trg_received_order_id
      AFTER INSERT ON received_order
      WHEN new.id IS NULL
      BEGIN
        UPDATE received_order
        SET id = (SELECT COALESCE(MAX(id), 0) + 1 FROM received_order)
        WHERE rowid = new.rowid;
      END;
    `);
  } catch (err) {
    console.warn('Migration pre_orders/surat_jalan BIGINT error:', err);
  }

  // Safe migration for bkk table relation fields
  try {
    const bkkCols = db.prepare('PRAGMA table_info(bkk)').all().map((c) => c.name);
    const newBkkCols = [
      ['nomorRO', 'TEXT'],
      ['preOrderId', 'TEXT'],
      ['jurnalId', 'TEXT'],
      ['poNumber', 'TEXT'],
      ['supplierId', 'TEXT'],
      ['customerId', 'TEXT'],
      ['subDetail', 'TEXT'],
      ['volume', 'REAL DEFAULT 0'],
      ['satuan', "TEXT DEFAULT 'm3'"],
      ['jenis', "TEXT DEFAULT 'CURAH | JASA ANGKUT + MATERIAL'"],
      ['timestamp', 'TEXT'],
      ['periode', 'TEXT'],
      ['rekeningSumber', 'TEXT'],
      ['status', "TEXT DEFAULT 'APPROVED'"],
      ['createdBy', "TEXT DEFAULT 'Admin'"],
      ['approvedBy', 'TEXT'],
      ['approvedAt', 'TEXT'],
      ['rejectionReason', 'TEXT'],
      ['created_at', 'TEXT'],
      ['updated_at', 'TEXT'],
    ];
    for (const [col, colType] of newBkkCols) {
      if (!bkkCols.includes(col)) {
        db.exec(`ALTER TABLE bkk ADD COLUMN ${col} ${colType};`);
      }
    }
  } catch (err) {
    console.warn('Migration bkk table error:', err);
  }

  // Safe migration for invoices table fields
  try {
    const invCols = db.prepare('PRAGMA table_info(invoices)').all().map((c) => c.name);
    const newInvCols = [
      ['customer', 'TEXT'],
      ['perusahaan', 'TEXT'],
      ['nomorInvoice', 'TEXT'],
      ['nomorFakturPajak', 'TEXT'],
      ['npwp', 'TEXT'],
      ['materialType', 'TEXT'],
      ['jenis', 'TEXT'],
      ['dpp', 'REAL DEFAULT 0'],
      ['tarifPpn', 'REAL DEFAULT 11'],
      ['ppn', 'REAL DEFAULT 0'],
      ['tarifPph', 'REAL DEFAULT 0'],
      ['pph', 'REAL DEFAULT 0'],
      ['statusFaktur', "TEXT DEFAULT 'APPROVED DJP'"],
      ['customerId', 'TEXT'],
      ['supplierId', 'TEXT'],
      ['preOrderId', 'TEXT'],
      ['jurnalId', 'TEXT'],
      ['customerAddress', 'TEXT'],
      ['subtotalJasa', 'REAL DEFAULT 0'],
      ['ppnNominal', 'REAL DEFAULT 0'],
      ['pphNominal', 'REAL DEFAULT 0'],
      ['satuan', "TEXT DEFAULT 'm3'"],
      ['hargaSatuan', 'REAL DEFAULT 0'],
      ['waktu', 'TEXT'],
      ['tanggalBayar', 'TEXT'],
      ['kirimKeRekening', 'TEXT'],
      ['rekeningAtasNama', 'TEXT'],
      ['timestamp', 'TEXT'],
      ['updated_at', 'TEXT'],
      ['status', "TEXT DEFAULT 'pending_approval'"],
      ['createdBy', 'TEXT'],
      ['approvedBy', 'TEXT'],
      ['approvedAt', 'TEXT'],
      ['rejectionReason', 'TEXT'],
      ['verifiedBy', 'TEXT'],
      ['verifiedAt', 'TEXT'],
    ];
    for (const [col, colType] of newInvCols) {
      if (!invCols.includes(col)) {
        db.exec(`ALTER TABLE invoices ADD COLUMN ${col} ${colType};`);
      }
    }
    // Synchronize customer and perusahaan if one is empty, and initialize default status
    db.exec(`
      UPDATE invoices SET customer = perusahaan WHERE (customer IS NULL OR customer = '') AND perusahaan IS NOT NULL;
      UPDATE invoices SET perusahaan = customer WHERE (perusahaan IS NULL OR perusahaan = '') AND customer IS NOT NULL;
      UPDATE invoices SET dpp = subtotalJasa WHERE (dpp IS NULL OR dpp = 0) AND subtotalJasa > 0;
      UPDATE invoices SET ppn = ppnNominal WHERE (ppn IS NULL OR ppn = 0) AND ppnNominal > 0;
      UPDATE invoices SET pph = pphNominal WHERE (pph IS NULL OR pph = 0) AND pphNominal > 0;
      UPDATE invoices SET status = 'paid' WHERE (status IS NULL OR status = '') AND (statusBayar = 'Lunas');
      UPDATE invoices SET status = 'pending_approval' WHERE (status IS NULL OR status = '');
    `);
  } catch (err) {
    console.warn('Migration invoices table error:', err);
  }

  // Safe migration for supplier_materials
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS supplier_materials (
        id TEXT PRIMARY KEY,
        supplierId TEXT NOT NULL,
        materialId TEXT NOT NULL,
        hargaBeliDefault REAL DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        created_at TEXT,
        UNIQUE(supplierId, materialId)
      );
      CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier ON supplier_materials(supplierId);
      CREATE INDEX IF NOT EXISTS idx_supplier_materials_material ON supplier_materials(materialId);
    `);
  } catch (err) {
    console.warn('Migration supplier_materials error:', err);
  }

  // Safe migration for jurnal_gi (statusLock, itemsSummary) & jurnal_audit_logs
  try {
    const jrnCols = db.prepare('PRAGMA table_info(jurnal_gi)').all().map((c) => c.name);
    if (!jrnCols.includes('statusLock')) {
      db.exec("ALTER TABLE jurnal_gi ADD COLUMN statusLock TEXT DEFAULT 'OPEN';");
    }
    if (!jrnCols.includes('itemsSummary')) {
      db.exec("ALTER TABLE jurnal_gi ADD COLUMN itemsSummary TEXT DEFAULT '[]';");
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS jurnal_audit_logs (
        id TEXT PRIMARY KEY,
        jurnalId TEXT NOT NULL,
        action TEXT NOT NULL,
        actorId TEXT,
        actorName TEXT NOT NULL,
        actorRole TEXT NOT NULL,
        reason TEXT,
        details TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_jurnal_audit_logs_jurnalId ON jurnal_audit_logs(jurnalId);
      CREATE INDEX IF NOT EXISTS idx_jurnal_gi_ro_tgl ON jurnal_gi (preOrderId, tanggal);
    `);
  } catch (err) {
    console.warn('Migration jurnal_gi lock/audit error:', err);
  }

  // Safe migration for surat_jalan dates (tanggalDibuat, tanggalJadwal)
  try {
    const sjCols = db.prepare('PRAGMA table_info(surat_jalan)').all().map((c) => c.name);
    if (!sjCols.includes('tanggalDibuat')) {
      db.exec('ALTER TABLE surat_jalan ADD COLUMN tanggalDibuat TEXT;');
      db.exec('UPDATE surat_jalan SET tanggalDibuat = tanggal WHERE tanggalDibuat IS NULL;');
    }
    if (!sjCols.includes('tanggalJadwal')) {
      db.exec('ALTER TABLE surat_jalan ADD COLUMN tanggalJadwal TEXT;');
      db.exec('UPDATE surat_jalan SET tanggalJadwal = tanggal WHERE tanggalJadwal IS NULL;');
    }
  } catch (err) {
    console.warn('Migration surat_jalan dates error:', err);
  }

  // Safe migration for bkk and invoices versioning (V2 support)
  try {
    const bkkCols = db.prepare('PRAGMA table_info(bkk)').all().map((c) => c.name);
    if (!bkkCols.includes('version')) {
      db.exec('ALTER TABLE bkk ADD COLUMN version INTEGER DEFAULT 1;');
    }
    if (!bkkCols.includes('parentDocId')) {
      db.exec('ALTER TABLE bkk ADD COLUMN parentDocId TEXT;');
    }
    if (!bkkCols.includes('isRevision')) {
      db.exec('ALTER TABLE bkk ADD COLUMN isRevision INTEGER DEFAULT 0;');
    }

    const invCols = db.prepare('PRAGMA table_info(invoices)').all().map((c) => c.name);
    if (!invCols.includes('version')) {
      db.exec('ALTER TABLE invoices ADD COLUMN version INTEGER DEFAULT 1;');
    }
    if (!invCols.includes('parentDocId')) {
      db.exec('ALTER TABLE invoices ADD COLUMN parentDocId TEXT;');
    }
    if (!invCols.includes('isRevision')) {
      db.exec('ALTER TABLE invoices ADD COLUMN isRevision INTEGER DEFAULT 0;');
    }
  } catch (err) {
    console.warn('Migration bkk/invoices versioning error:', err);
  }

  // Create table indexes safely after schema migrations
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tanggal ON invoices(tanggal);
      CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoice_docs_invoiceId ON invoice_documents(invoiceId);
      CREATE INDEX IF NOT EXISTS idx_invoice_audit_invoiceId ON invoice_audit_logs(invoiceId);
      CREATE INDEX IF NOT EXISTS idx_invoice_audit_timestamp ON invoice_audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_pph21_tanggal ON pph21_records(tanggal);
      CREATE INDEX IF NOT EXISTS idx_pph23_tanggal ON pph23_records(tanggal);
      CREATE INDEX IF NOT EXISTS idx_bkk_tanggal ON bkk(tanggal);
      CREATE INDEX IF NOT EXISTS idx_bkk_perusahaan ON bkk(perusahaan);
      CREATE INDEX IF NOT EXISTS idx_bkk_docs_bkkId ON bkk_documents(bkkId);
      CREATE INDEX IF NOT EXISTS idx_bkk_audit_bkkId ON bkk_audit_logs(bkkId);
      CREATE INDEX IF NOT EXISTS idx_bkk_audit_timestamp ON bkk_audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_received_order_customer ON received_order(customer);
      CREATE INDEX IF NOT EXISTS idx_received_order_ro ON received_order(nomorRO);
      CREATE INDEX IF NOT EXISTS idx_suratjalan_customer ON surat_jalan(customer);
      CREATE INDEX IF NOT EXISTS idx_suratjalan_ro ON surat_jalan(nomorRO);
    `);
  } catch (err) {
    console.warn('Index creation error:', err);
  }

  // Auto-link relations between transactions and master tables
  try {
    db.exec(`
      UPDATE received_order
      SET customerId = (SELECT id FROM customers WHERE customers.name = received_order.customer LIMIT 1)
      WHERE customerId IS NULL AND customer IS NOT NULL;

      UPDATE bkk
      SET supplierId = (SELECT id FROM suppliers WHERE suppliers.name = bkk.perusahaan LIMIT 1)
      WHERE supplierId IS NULL AND perusahaan IS NOT NULL;

      UPDATE bkk
      SET customerId = (SELECT customerId FROM received_order WHERE received_order.id = bkk.preOrderId OR (bkk.nomorRO IS NOT NULL AND received_order.nomorRO = bkk.nomorRO) LIMIT 1)
      WHERE customerId IS NULL;

      UPDATE invoices
      SET customerId = (SELECT id FROM customers WHERE customers.name = invoices.perusahaan OR customers.name = invoices.customer LIMIT 1)
      WHERE customerId IS NULL AND (perusahaan IS NOT NULL OR customer IS NOT NULL);
    `);
  } catch (err) {
    console.warn('Auto-linking master relations error:', err);
  }

  seedInitialData();
  syncJournalsAndWaybills();
  syncBkkAndInvoices();
}

/**
 * Synchronize approved Pre Orders to Jurnal GI and link all Surat Jalan waybills.
 * Strictly purges any orphan journal or waybill data not matching the Pre Orders page.
 */
function getCustomerPrefix(custNameOrObj) {
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

function generateNomorRO(custNameOrObj, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const monthYear = `${mm}${yyyy}`;
  const prefix = getCustomerPrefix(custNameOrObj);

  const rows = db.prepare(`
    SELECT nomorRO FROM received_order WHERE nomorRO IS NOT NULL
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
    SELECT nomorPo as poNum FROM received_order WHERE nomorPo IS NOT NULL
    UNION
    SELECT nomorPoCustomer as poNum FROM received_order WHERE nomorPoCustomer IS NOT NULL
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

export function syncJournalsAndWaybills() {
  try {
    // 0. PURGE ORPHAN DATA & EMPTY PLACEHOLDER JOURNALS (journals are created on 1st SJ, not on RO approval)
    db.exec(`
      DELETE FROM jurnal_gi
      WHERE (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM received_order))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM received_order WHERE nomorRO IS NOT NULL)))
         OR id IN ('REK-202611-0001', 'REK-202611-0002')
         OR poNumber IN ('PO-LW-2026-089', 'PO-SI-2026-014', 'PO-DRAFT-01', 'PO-DRAFT-02')
         OR (
           totalSj = 0
           AND status = 'Siap Kirim'
           AND COALESCE(statusLock, 'OPEN') = 'OPEN'
           AND NOT EXISTS (SELECT 1 FROM surat_jalan sj WHERE sj.jurnalId = jurnal_gi.id)
         );

      DELETE FROM surat_jalan
      WHERE (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM received_order))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM received_order WHERE nomorRO IS NOT NULL)))
         OR id IN ('SJ-202611-0089', 'SJ-202611-0090', 'SJ-202611-0091')
         OR poNumber IN ('PO-LW-2026-089', 'PO-SI-2026-014', 'PO-DRAFT-01', 'PO-DRAFT-02');
    `);

    // 1. Ensure all APPROVED/SELESAI_KIRIM Received Orders have a valid nomorRO
    const activePos = db.prepare("SELECT * FROM received_order WHERE status IN ('APPROVED', 'SELESAI_KIRIM')").all();
    for (const po of activePos) {
      if (!po.nomorRO) {
        const nomorRO = generateNomorRO(po.customer, po.tanggal ? new Date(po.tanggal) : new Date());
        db.prepare('UPDATE received_order SET nomorRO = ? WHERE id = ?').run(nomorRO, po.id);
      }
    }

    // 2. Link orphan surat_jalan pointers to matching daily jurnal_gi without bypassing OPEN unsealed state
    const allSj = db.prepare('SELECT * FROM surat_jalan').all();
    const allMaterials = db.prepare('SELECT * FROM materials').all();
    for (const sj of allSj) {
      let po = null;
      if (sj.preOrderId) {
        po = db.prepare('SELECT * FROM received_order WHERE CAST(id AS TEXT) = CAST(? AS TEXT)').get(String(sj.preOrderId));
      }
      if (!po && sj.poNumber) {
        po = db.prepare('SELECT * FROM received_order WHERE nomorPo = ? OR CAST(id AS TEXT) = CAST(? AS TEXT)').get(sj.poNumber, String(sj.poNumber));
      }
      if (!po && sj.nomorRO) {
        po = db.prepare('SELECT * FROM received_order WHERE nomorRO = ?').get(sj.nomorRO);
      }

      const sjInputDate = sj.tanggalDibuat || sj.tanggal;
      let jurnal = null;
      if (sj.jurnalId) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE id = ?').get(sj.jurnalId);
      }
      if (!jurnal && po && sjInputDate) {
        jurnal = db.prepare('SELECT * FROM jurnal_gi WHERE (CAST(preOrderId AS TEXT) = CAST(? AS TEXT) OR (nomorRO IS NOT NULL AND nomorRO = ?)) AND tanggal = ?').get(
          String(po.id),
          po.nomorRO || '',
          sjInputDate
        );
      }

      if (jurnal) {
        if (!sj.jurnalId || !sj.nomorRO || !sj.preOrderId) {
          db.prepare('UPDATE surat_jalan SET nomorRO = ?, jurnalId = ?, preOrderId = ? WHERE id = ?').run(
            jurnal.nomorRO,
            jurnal.id,
            jurnal.preOrderId || po?.id || null,
            sj.id
          );
        }

        // Only reconcile details automatically for LOCKED journals; OPEN journals wait for manual Lock
        if (jurnal.statusLock === 'LOCKED') {
          let details = [];
          try {
            details = typeof jurnal.suratJalanDetails === 'string' ? JSON.parse(jurnal.suratJalanDetails) : (jurnal.suratJalanDetails || []);
          } catch (e) {
            details = [];
          }

          if (!details.some((d) => d.id === sj.id)) {
            const jrnSjs = db.prepare(`
              SELECT * FROM surat_jalan
              WHERE jurnalId = ?
                 OR (
                   (CAST(preOrderId AS TEXT) = CAST(? AS TEXT) OR (nomorRO IS NOT NULL AND nomorRO != '' AND nomorRO = ?))
                   AND COALESCE(tanggalDibuat, tanggal) = ?
                 )
              ORDER BY COALESCE(tanggalDibuat, tanggal) ASC, waktu ASC, id ASC
            `).all(jurnal.id, String(jurnal.preOrderId || ''), jurnal.nomorRO || '', jurnal.tanggal || '');

            const cumRow = db.prepare(`
              SELECT COALESCE(SUM(volumeAkhir), 0) as cumVol
              FROM surat_jalan
              WHERE CAST(preOrderId AS TEXT) = CAST(? AS TEXT) OR (nomorRO IS NOT NULL AND nomorRO != '' AND nomorRO = ?)
            `).get(String(jurnal.preOrderId || po?.id || ''), jurnal.nomorRO || '');
            const cumulativeVol = Number((cumRow?.cumVol || 0).toFixed(2));

            const agg = aggregateJournalWaybills({
              sjs: jrnSjs,
              jurnal,
              po,
              materialsList: allMaterials,
              cumulativeVol,
            });

            db.prepare(`
              UPDATE jurnal_gi
              SET material = ?, totalSj = ?, totalVolume = ?, nominalBeli = ?, nominalJual = ?,
                  status = ?, itemsSummary = ?, suratJalanDetails = ?, updated_at = ?
              WHERE id = ?
            `).run(
              agg.materialLabel,
              agg.totalSj,
              agg.totalVolume,
              agg.nominalBeli,
              agg.nominalJual,
              agg.status,
              JSON.stringify(agg.itemsSummary),
              JSON.stringify(agg.suratJalanDetails),
              new Date().toISOString(),
              jurnal.id
            );
          }
        }
      }
    }

    // 3. Recompute received_order.terkirim from actual surat_jalan records
    for (const po of activePos) {
      const row = db.prepare('SELECT COALESCE(SUM(volumeAkhir), 0) as totalVol FROM surat_jalan WHERE CAST(preOrderId AS TEXT) = CAST(? AS TEXT) OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(String(po.id), po.nomorRO || '');
      const actualVol = Number((row?.totalVol || 0).toFixed(2));
      if (Number(po.terkirim || 0) !== actualVol) {
        db.prepare('UPDATE received_order SET terkirim = ? WHERE id = ?').run(actualVol, po.id);
      }
    }
  } catch (err) {
    console.warn('Error during syncJournalsAndWaybills:', err);
  }
}

/**
 * Synchronize approved Pre Orders and Jurnal GI summaries to BKK (Cash Out) and Invoices.
 * Strictly purges any orphan or dummy BKK / Invoice records.
 * Per specification:
 * - 1 BKK Vendor and 1 Invoice Customer per Nomor RO / Jurnal Summary.
 * - For BKK: Supplier name (e.g. UKHY DIAN) as main company, with Customer and Nomor RO in subDetail.
 * - For Invoice: Customer name as main company.
 */
export function syncBkkAndInvoices() {
  try {
    // 0. PURGE DUMMY AND ORPHAN DATA
    db.exec(`
      DELETE FROM bkk
      WHERE id IN ('bkk-1', 'bkk-2', 'bkk-3', 'co-1', 'co-2', 'co-3', 'co-4', 'co-5', 'bkk-0')
         OR kodeTransaksi IN ('TRX-202611-001', 'TRX-202611-002', 'TRX-202611-003')
         OR (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM received_order))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM received_order WHERE nomorRO IS NOT NULL)));

      DELETE FROM invoices
      WHERE id IN ('inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6')
         OR (preOrderId IS NOT NULL AND preOrderId NOT IN (SELECT id FROM received_order))
         OR (preOrderId IS NULL AND (nomorRO IS NULL OR nomorRO NOT IN (SELECT nomorRO FROM received_order WHERE nomorRO IS NOT NULL)));
    `);

    // 1. Ensure active BKK and Invoices for each Jurnal GI entry
    const allJurnals = db.prepare('SELECT * FROM jurnal_gi').all();
    const defaultSupplier = db.prepare("SELECT * FROM suppliers WHERE aktif = 1 LIMIT 1").get() || {
      name: 'UKHY DIAN',
      penerima: 'UKHY DIAN',
      bank: 'BCA',
      noRekening: '6150832452',
    };

    for (const jrn of allJurnals) {
      let details = [];
      try {
        details = typeof jrn.suratJalanDetails === 'string' ? JSON.parse(jrn.suratJalanDetails) : (jrn.suratJalanDetails || []);
      } catch (e) {
        details = [];
      }

      const dates = details.map((d) => d.tanggal).filter(Boolean);
      const uniqueDates = [...new Set(dates)].sort();
      const minDate = uniqueDates[0] || jrn.tanggal || new Date().toISOString().split('T')[0];
      const maxDate = uniqueDates[uniqueDates.length - 1] || minDate;
      const periodeStr = uniqueDates.length > 1
        ? `Periode: [${minDate}, ${maxDate}]`
        : `Periode: [${minDate}]`;
      const timestampStr = `${maxDate} 10:00:00`;

      // Resolve accurate PO Number from received_order if jurnal had draft/placeholder
      let resolvedPo = jrn.poNumber;
      if (!resolvedPo || resolvedPo === 'MENUNGGU SURAT JALAN PERTAMA' || resolvedPo.startsWith('PO-DRAFT-')) {
        const poRow = db.prepare('SELECT nomorPo FROM received_order WHERE id = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(jrn.preOrderId, jrn.nomorRO);
        if (poRow?.nomorPo && poRow.nomorPo !== 'MENUNGGU SURAT JALAN PERTAMA') {
          resolvedPo = poRow.nomorPo;
          db.prepare('UPDATE jurnal_gi SET poNumber = ? WHERE id = ?').run(resolvedPo, jrn.id);
        } else {
          resolvedPo = null;
        }
      }

      const effectivePoNum = resolvedPo ? String(resolvedPo).trim().slice(0, 50) : null;
      const roTail = String(jrn.nomorRO).slice(-4).replace('-', '');
      const invCode = effectivePoNum ? `${effectivePoNum} - INV - ${roTail}` : `INV - ${jrn.nomorRO}`;
      let existingInv = db.prepare('SELECT * FROM invoices WHERE jurnalId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(jrn.id, jrn.nomorRO);

      const invVolume = Number(jrn.totalVolume) || 0;
      const invAmount = Number(jrn.nominalJual) || 0;
      const nowIso = new Date().toISOString();

      const custRow = db.prepare('SELECT id FROM customers WHERE name = ? LIMIT 1').get(jrn.customer);
      const custId = custRow?.id || 'cust-1';
      const supRow = db.prepare('SELECT id FROM suppliers WHERE name = ? LIMIT 1').get(defaultSupplier.name);
      const supId = supRow?.id || defaultSupplier.id || 'sup-1';

      // Tax calculations for synchronized invoice
      const isCurah = !String(jrn.material || '').toUpperCase().includes('BOULDER') && !String(jrn.material || '').toUpperCase().includes('BATU');
      const pphRate = isCurah ? 2.0 : 2.65;
      const isPpn = Boolean(jrn.isPpn);
      const ppnNom = isPpn ? Math.round((invAmount * 11) / 100) : 0;
      const pphNom = Math.round((invAmount * pphRate) / 100);
      const totalBersih = invAmount + ppnNom - pphNom;

      // ── A. INVOICES (CUSTOMER BILLING) ──
      // Catatan Bisnis PT BAS: Invoice dibuat secara manual oleh Admin setelah Order komplit 100% (semua trip pengiriman selesai).
      // Sistem TIDAK membuat Invoice secara otomatis.
      if (existingInv) {
        db.prepare(`
          UPDATE invoices
          SET customerId = COALESCE(customerId, ?), poNumber = COALESCE(poNumber, ?),
              periode = COALESCE(periode, ?), updated_at = ?
          WHERE id = ?
        `).run(
          custId,
          effectivePoNum,
          periodeStr,
          nowIso,
          existingInv.id
        );
      }

      // ── B. BKK (CASH OUT VENDOR / HPP) ──
      // Catatan Bisnis PT BAS: BKK dibuat secara manual oleh Admin setelah Order komplit 100%.
      // Sistem TIDAK membuat BKK secara otomatis.
      let existingBkk = db.prepare('SELECT * FROM bkk WHERE jurnalId = ? OR (nomorRO IS NOT NULL AND nomorRO = ?)').get(jrn.id, jrn.nomorRO);
      if (existingBkk) {
        db.prepare(`
          UPDATE bkk
          SET supplierId = COALESCE(supplierId, ?),
              customerId = COALESCE(customerId, ?),
              poNumber = COALESCE(poNumber, ?)
          WHERE id = ?
        `).run(
          supId,
          custId,
          effectivePoNum || jrn.poNumber || null,
          existingBkk.id
        );
      }
    }
  } catch (err) {
    console.warn('Error during syncBkkAndInvoices:', err);
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
  } catch (e) { }

  // Purge any legacy hardcoded dummy RO records if previously seeded
  try {
    db.prepare("DELETE FROM received_order WHERE id IN (1795062000001, 1795062166339, 1795062530575, 1795073959896, 'RO-LW-655-4590011130', 'RO-WS-576-4510010537', 'RO-KIAS-004-POS-2608-000224', 'RO-SAS-965-4500005548')").run();
  } catch (e) { }

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
    insertSup.run('sup-8', 'ADITA JUSTIA SAPUTRA', 'SUP-008', 'PAK ADIT', '0822-6655-4433', 0, 'BCA', '7415428618', 'ADITA JUSTIA SAPUTRA');
  }

  // Seed supplier_materials if empty
  try {
    const smCount = db.prepare('SELECT COUNT(*) as count FROM supplier_materials').get().count;
    if (smCount === 0) {
      const allSups = db.prepare('SELECT id FROM suppliers WHERE aktif = 1').all();
      const allMats = db.prepare('SELECT id, beli FROM materials WHERE aktif = 1').all();
      const insertSM = db.prepare(`
        INSERT OR IGNORE INTO supplier_materials (id, supplierId, materialId, hargaBeliDefault, aktif, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
      `);
      const now = new Date().toISOString();
      for (const s of allSups) {
        for (const m of allMats) {
          insertSM.run(`sm-${s.id}-${m.id}`, s.id, m.id, m.beli || 0, now);
        }
      }
    }
  } catch (err) {
    console.warn('Seed supplier_materials error:', err);
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

  // Seed customers if empty or missing standard customers
  const insertCust = db.prepare(`
    INSERT OR IGNORE INTO customers (id, name, alias, badanUsaha, alamat, npwp, telepon, kodePrefix, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertCust.run('cust-1', 'PT LION WINGS', 'LION WINGS, PT', 'PT', 'Kawasan Industri Gresik (KIG) Blok C-12, Manyar, Gresik', '01.234.567.8-012.000', '031-3981234', 'LW');
  insertCust.run('cust-2', 'PT SEMEN INDONESIA', 'SMN', 'PT', 'Jl. Veteran, Gresik', '01.987.654.3-098.000', '031-3985678', 'SI');
  insertCust.run('cust-3', 'PT SOLUSI BANGUN INDONESIA', 'SBI', 'PT', 'Tuban Quarry Complex', '02.345.678.9-023.000', '0356-321456', 'SBI');
  insertCust.run('cust-4', 'PT PETROKIMIA GRESIK', 'PG', 'PT', 'Jl. Jenderal Ahmad Yani, Gresik', '01.111.222.3-011.000', '031-3982200', 'PG');
  insertCust.run('cust-5', 'PT WINGS SURYA', 'WINGS SURYA, PT', 'PT', 'Jl. Rungkut Industri III, Surabaya', '01.234.567.8-013.000', '031-8431234', 'WS');
  insertCust.run('cust-6', 'PT KARYA INDAH ALAM SEJAHTERA', 'KARYA INDAH ALAM SEJAHTERA, PT', 'PT', 'Jl. Raya Manyar Km. 11, Gresik', '01.234.567.8-014.000', '031-3951234', 'KIAS');
  insertCust.run('cust-7', 'PT SEHAT ALAM SEGAR', 'SEHAT ALAM SEGAR, PT', 'PT', 'Kawasan Industri Sedati, Sidoarjo', '01.234.567.8-015.000', '031-8661234', 'SAS');
  insertCust.run('cust-8', 'PT ADHI KARYA', 'ADHI KARYA', 'PT', 'Proyek Smelter Freeport Manyar, Gresik', '01.001.611.1-093.000', '031-7992000', 'ADM');
  insertCust.run('cust-9', 'PT ANEKA SISTEM', 'ANEKA SISTEM', 'PT', 'Jl. Raya Manyar Km. 11, Gresik', '02.345.678.9-612.000', '031-3958800', 'AS');
  insertCust.run('cust-10', 'PT BERKAH ALAM SEMESTA', 'BERKAH ALAM SEMESTA', 'PT', 'Gresik Hub, Jawa Timur', '03.456.789.0-612.000', '031-3980000', 'BAS');
  insertCust.run('cust-asco', 'ASCO DWI MOBILINDO, PT', 'ASCO DWI MOBILINDO, PT', 'PT', 'Kawasan Industri Gresik, Manyar', '01.234.567.8-044.000', '031-3984400', 'ADM 044');

  // Pre-orders, Surat Jalan, Jurnal GI, BKK, and Invoices are NOT seeded with dummy records
  // They are strictly populated from real administrative transactions and synchronized

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


import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { calculateKubikasi } from '../utils/formatters';

const STORAGE_KEYS = {
  materials: 'ptbas_materials_v2',
  suppliers: 'ptbas_suppliers_v2',
  customers: 'ptbas_customers_v2',
  armada: 'ptbas_armada_v2',
  banks: 'ptbas_banks_v2',
  bankAccounts: 'ptbas_bank_accounts_v2',
  currencies: 'ptbas_currencies_v2',
  preOrders: 'ptbas_preorders_v2',
  suratJalan: 'ptbas_suratjalan_v2',
  bkk: 'ptbas_bkk_v2',
  invoices: 'ptbas_invoices_v2',
  rekapan: 'ptbas_rekapan_v2',
};

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

function getAuthUser() {
  try {
    const raw = sessionStorage.getItem('ptbas_auth_session_v1') || localStorage.getItem('ptbas_auth_session_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function getAuthHeaders() {
  const user = getAuthUser();
  if (user) {
    const isSA = isUserSuperAdmin(user);
    return {
      'x-user-role': isSA ? 'superadmin' : (user.role || 'admin'),
      'x-user-email': user.email || (isSA ? 'superadmin@ptbas.co.id' : ''),
      'x-user-id': user.id || '',
      'x-user-name': user.name || user.nama || (isSA ? 'David Rusiah (Super Admin / Direktur)' : 'Admin'),
    };
  }
  return {
    'x-user-role': 'superadmin',
    'x-user-email': 'superadmin@ptbas.co.id',
    'x-user-id': 'usr-1',
    'x-user-name': 'David Rusiah (Super Admin / Direktur)',
  };
}

export function getCustomerPrefix(custNameOrObj, customersList = []) {
  if (!custNameOrObj) return 'GEN';
  if (typeof custNameOrObj === 'object') {
    if (custNameOrObj.kodePrefix) return custNameOrObj.kodePrefix.replace(/\s+/g, '').toUpperCase();
    if (custNameOrObj.name) custNameOrObj = custNameOrObj.name;
    else return 'GEN';
  }
  const custName = String(custNameOrObj).trim();
  
  const normalize = (s) => s.toLowerCase().replace(/\b(pt|cv|tbk|persero)\b/gi, '').replace(/[^a-z0-9]/g, '').trim();
  const targetNorm = normalize(custName);

  const customers = customersList || [];

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

export function generateNomorRO(custNameOrObj, existingRos = [], date = new Date(), customersList = []) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const monthYear = `${mm}${yyyy}`;
  const prefix = getCustomerPrefix(custNameOrObj, customersList);

  let maxSeq = 0;
  const roList = Array.isArray(existingRos) ? existingRos : [];
  for (const item of roList) {
    const str = typeof item === 'string' ? item : (item?.nomorRO || item?.nomorRo || '');
    if (!str) continue;
    const match = str.match(new RegExp(`-${monthYear}-(\\d+)`));
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

export function generatePoNumber(custNameOrObj, existingPos = [], date = new Date(), customersList = []) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const monthYear = `${mm}${yyyy}`;
  const prefix = getCustomerPrefix(custNameOrObj, customersList);

  let maxSeq = 0;
  const poList = Array.isArray(existingPos) ? existingPos : [];
  for (const item of poList) {
    const str = typeof item === 'string'
      ? item
      : (item?.nomorPo || item?.poNumber || item?.nomorPoCustomer || '');
    if (!str || str === 'MENUNGGU SURAT JALAN PERTAMA' || str.startsWith('PO-DRAFT-')) continue;
    const match = str.match(new RegExp(`-${monthYear}-(\\d+)`));
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

function isUserSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (email === 'rainorchesta@gmail.com') return false;
  const normalizedRole = String(user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (normalizedRole === 'superadmin' || normalizedRole === 'direktur' || normalizedRole === 'direksi') return true;
  const superAdminList = ['superadmin@ptbas.co.id', 'direksi@ptbas.co.id', 'david.rusiah@ptbas.co.id'];
  return superAdminList.includes(email) || email.startsWith('superadmin');
}

export function normalizeBkkItem(item) {
  if (!item || typeof item !== 'object') return item;
  const vol = Number(item.volume ?? item.kubikasi ?? 0) || 0;
  return {
    ...item,
    volume: vol,
    kubikasi: Number(item.kubikasi ?? item.volume ?? vol) || vol,
    amount: Number(item.amount ?? 0) || 0,
    timestamp: item.timestamp || (item.tanggal ? `${item.tanggal} 08:00:00` : ''),
    tanggal: item.tanggal || (item.timestamp ? String(item.timestamp).slice(0, 10) : ''),
    subDetail: item.subDetail || item.penerima || '-',
    penerima: item.penerima || item.subDetail || '-',
    jenis: item.jenis || 'CURAH | JASA ANGKUT + MATERIAL',
    periode: item.periode || (item.tanggal ? String(item.tanggal).slice(0, 7) : (item.timestamp ? String(item.timestamp).slice(0, 7) : '-')),
    statusBayar: item.statusBayar || 'Belum Dibayar',
    status: item.status || 'APPROVED',
    createdBy: item.createdBy || 'Admin',
    approvedBy: item.approvedBy || null,
    approvedAt: item.approvedAt || null,
    rejectionReason: item.rejectionReason || null,
    kodeTransaksi: item.kodeTransaksi || '-',
    perusahaan: item.perusahaan || '-',
    material: item.material || '-',
  };
}

export function normalizeInvoiceItem(item) {
  if (!item || typeof item !== 'object') return item;
  const vol = Number(item.volume ?? 0) || 0;
  return {
    ...item,
    volume: vol,
    amount: Number(item.amount ?? item.totalTagihan ?? 0) || 0,
    hargaSatuan: Number(item.hargaSatuan ?? 0) || 0,
    subtotalJasa: Number(item.subtotalJasa ?? item.amount ?? 0) || 0,
    dpp: Number(item.dpp ?? item.subtotalJasa ?? item.amount ?? 0) || 0,
    tarifPpn: Number(item.tarifPpn ?? 11),
    ppnNominal: Number(item.ppnNominal ?? item.ppn ?? 0) || 0,
    ppn: Number(item.ppn ?? item.ppnNominal ?? 0) || 0,
    tarifPph: Number(item.tarifPph ?? 0),
    pphNominal: Number(item.pphNominal ?? item.pph ?? 0) || 0,
    pph: Number(item.pph ?? item.pphNominal ?? 0) || 0,
    timestamp: item.timestamp || (item.tanggal ? `${item.tanggal} 10:00:00` : ''),
    tanggal: item.tanggal || (item.timestamp ? String(item.timestamp).slice(0, 10) : ''),
    statusBayar: item.statusBayar || 'Belum Dibayar',
    status: item.status || (item.statusBayar === 'Lunas' ? 'paid' : 'pending_approval'),
    createdBy: item.createdBy || 'Admin',
    approvedBy: item.approvedBy || null,
    approvedAt: item.approvedAt || null,
    rejectionReason: item.rejectionReason || null,
    verifiedBy: item.verifiedBy || null,
    verifiedAt: item.verifiedAt || null,
    kodeTransaksi: item.kodeTransaksi || item.nomorInvoice || '-',
    nomorInvoice: item.nomorInvoice || item.kodeTransaksi || '-',
    perusahaan: item.perusahaan || item.customer || '-',
    customer: item.customer || item.perusahaan || '-',
    material: item.material || '-',
    materialType: item.materialType || 'Curah',
    jenis: item.jenis || 'JASA ANGKUT + MATERIAL',
    periode: item.periode || (item.tanggal ? `Periode: [${item.tanggal}]` : '-'),
    kirimKeRekening: item.kirimKeRekening || 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    rekeningAtasNama: item.rekeningAtasNama || 'PT Berkah Alam Semesta',
    latestDocument: item.latestDocument || null,
    documentCount: item.documentCount || 0,
    hasSignedDocument: Boolean(item.latestDocument || item.hasSignedDocument),
  };
}

export const INITIAL_CURRENCIES = [
  {
    id: 'curr-idr',
    code: 'IDR',
    isoCode: '360',
    name: 'Rupiah Indonesia',
    englishName: 'Indonesian Rupiah',
    symbol: 'Rp',
    country: 'Indonesia (Bank Indonesia)',
    pemisahRibuan: 'Titik (.)',
    pemisahDesimal: 'Koma (,)',
    formatSample: 'Rp 18.712.800,00',
    presisi: '2 Digit Koma',
    formatPresisi: '24,50 m³',
    pajak: 'PPN 11% & PPh 22 (0.25% - 1.5%)',
    isBase: true,
    deskripsi: 'Mata uang basis resmi pembukuan akuntansi, buku besar (GL), kas operasional (BKK), dan faktur customer PT BAS.',
    lingkupModul: ['Buku Besar (GL)', 'BKK (Cash Out)', 'Faktur Invoice', 'Surat Jalan', 'RO'],
    aktif: true,
  },
  {
    id: 'curr-usd',
    code: 'USD',
    isoCode: '840',
    name: 'Dolar Amerika Serikat',
    englishName: 'United States Dollar',
    symbol: '$',
    country: 'Amerika Serikat (Federal Reserve)',
    pemisahRibuan: 'Koma (,)',
    pemisahDesimal: 'Titik (.)',
    formatSample: '$ 1,250.00',
    presisi: '2 Digit Desimal',
    formatPresisi: '24.50 m³',
    pajak: 'Non-PPN / Transaksi Valas',
    isBase: false,
    deskripsi: 'Valuta asing pendukung untuk kontrak pengadaan material internasional dan order customer berbasis Dolar AS.',
    lingkupModul: ['Pre Order Customer', 'Kontrak Vendor Valas'],
    aktif: true,
  },
  {
    id: 'curr-eur',
    code: 'EUR',
    isoCode: '978',
    name: 'Euro Uni Eropa',
    englishName: 'Euro',
    symbol: '€',
    country: 'Uni Eropa (European Central Bank)',
    pemisahRibuan: 'Titik (.)',
    pemisahDesimal: 'Koma (,)',
    formatSample: '€ 1.100,00',
    presisi: '2 Digit Desimal',
    formatPresisi: '24,50 m³',
    pajak: 'Non-PPN / Transaksi Valas',
    isBase: false,
    deskripsi: 'Valuta asing cadangan untuk impor suku cadang dump truck dan mesin pemecah batu (stone crusher).',
    lingkupModul: ['Pengadaan Suku Cadang Alat'],
    aktif: false,
  },
];

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { addToast } = useToast();

  // ==========================================
  // 1. DATA TRANSAKSI OPERASIONAL
  // ==========================================

  // Pre Order list per PT BAS Gresik (starts clean, dummy records removed)
  const [preOrders, setPreOrders] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.preOrders, []);
    const filtered = Array.isArray(raw)
      ? raw.filter((p) => p.id !== 'PO-DRAFT-01' && p.id !== 'PO-DRAFT-02' && p.id !== 'PO-DRAFT-03')
      : [];
    try {
      localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(filtered));
    } catch (e) {}
    return filtered;
  });

  // Surat Jalan (Good Issue) list (cleaned of dummy data, synchronized with Pre Orders)
  const [suratJalanList, setSuratJalanList] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.suratJalan, []);
    const filtered = Array.isArray(raw)
      ? raw.filter(
          (s) =>
            s.id !== 'SJ-202611-0089' &&
            s.id !== 'SJ-202611-0090' &&
            s.id !== 'SJ-202611-0091' &&
            s.poNumber !== 'PO-LW-2026-089'
        )
      : [];
    try {
      localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(filtered));
    } catch (e) {}
    return filtered;
  });

  // BKK (Cash Out) transactions strictly synchronized with SQLite and purged of dummy records
  const [bkkList, setBkkList] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.bkk, []);
    const filtered = Array.isArray(raw)
      ? raw.filter(
          (b) =>
            !['co-1', 'co-2', 'co-3', 'co-4', 'co-5', 'bkk-0', 'bkk-1', 'bkk-2', 'bkk-3'].includes(b.id) &&
            !String(b.id || '').startsWith('dummy') &&
            !String(b.kodeTransaksi || '').includes('POS-2608') &&
            !String(b.kodeTransaksi || '').includes('POL-2607') &&
            !String(b.kodeTransaksi || '').includes('4500391980') &&
            !String(b.kodeTransaksi || '').includes('TRX-202611-00')
        )
      : [];
    try {
      localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(filtered));
    } catch (e) {}
    return filtered.map(normalizeBkkItem);
  });

  // Invoices strictly synchronized with SQLite and purged of dummy records
  const [invoiceList, setInvoiceList] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.invoices, []);
    const filtered = Array.isArray(raw)
      ? raw.filter(
          (inv) =>
            !['inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6'].includes(inv.id) &&
            !String(inv.id || '').startsWith('dummy') &&
            !String(inv.kodeTransaksi || '').includes('POS-2608') &&
            !String(inv.kodeTransaksi || '').includes('POL-2607') &&
            !String(inv.kodeTransaksi || '').includes('4500391980') &&
            !String(inv.kodeTransaksi || '').includes('4510010537') &&
            !String(inv.kodeTransaksi || '').includes('4590011130')
        )
      : [];
    const normalized = filtered.map(normalizeInvoiceItem);
    try {
      localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(normalized));
    } catch (e) {}
    return normalized;
  });

  // Jurnal GI / Rekapan list per PT BAS (cleaned of dummy data, synchronized with Pre Orders)
  const [rekapanList, setRekapanList] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.rekapan, []);
    const filtered = Array.isArray(raw)
      ? raw.filter(
          (r) =>
            r.id !== 'REK-202611-0001' &&
            r.id !== 'REK-202611-0002' &&
            r.poNumber !== 'PO-LW-2026-089' &&
            r.poNumber !== 'PO-SI-2026-014'
        )
      : [];
    try {
      localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(filtered));
    } catch (e) {}
    return filtered;
  });

  // ==========================================
  // 2. DATA MASTER (FAITHFUL TO SCREENSHOTS)
  // ==========================================

  // Data Material per Screenshot e79f026e
  const [materials, setMaterials] = useState(() => loadStorage(STORAGE_KEYS.materials, [
    {
      id: 'mat-1',
      name: 'BASE COURSE',
      beli: 40000.0,
      jual: 50000.0,
      coa: '110-10',
      coaPiutang: '112-01',
      coaPendapatan: '410-01',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-2',
      name: 'BATU BOULDER',
      beli: 32580.0,
      jual: 45800.0,
      coa: '110-20',
      coaPiutang: '112-02',
      coaPendapatan: '410-02',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-3',
      name: 'JASA ANGKUT',
      beli: 20408.0,
      jual: 20408.0,
      coa: '110-30',
      coaPiutang: '112-03',
      coaPendapatan: '410-03',
      category: 'Jasa',
      itemType: 'JASA_ANGKUT',
      materialId: 'mat-8',
      pphRate: 2.0,
      satuan: '',
      defaultUnit: '',
      aktif: true,
    },
    {
      id: 'mat-4',
      name: 'LIMESTONE',
      beli: 38991.0,
      jual: 42857.0,
      coa: '110-40',
      coaPiutang: '112-04',
      coaPendapatan: '410-04',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-5',
      name: 'PARAS',
      beli: 41000.0,
      jual: 45000.0,
      coa: '110-50',
      coaPiutang: '112-05',
      coaPendapatan: '410-05',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-6',
      name: 'PASIR',
      beli: 40000.0,
      jual: 50000.0,
      coa: '110-60',
      coaPiutang: '112-06',
      coaPendapatan: '410-06',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-7',
      name: 'PAVING STONE',
      beli: 71000.0,
      jual: 76000.0,
      coa: '110-70',
      coaPiutang: '112-07',
      coaPendapatan: '410-07',
      category: 'Padat',
      pphRate: 2.65,
      satuan: 'm2',
      aktif: true,
    },
    {
      id: 'mat-8',
      name: 'SIRTU',
      beli: 50765.0,
      jual: 67233.0,
      coa: '110-80',
      coaPiutang: '112-08',
      coaPendapatan: '410-08',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
    {
      id: 'mat-9',
      name: 'SIRTU AYAK',
      beli: 25000.0,
      jual: 37000.0,
      coa: '110-85',
      coaPiutang: '112-09',
      coaPendapatan: '410-09',
      category: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      aktif: true,
    },
  ]));

  // Data Supplier per Screenshot 38e7625c
  const [suppliers, setSuppliers] = useState(() => loadStorage(STORAGE_KEYS.suppliers, [
    {
      id: 'sup-1',
      name: 'UKHY DIAN',
      idProgram: 'SUP-001',
      penerima: 'UKHY DIAN',
      telepon: '0812-3456-7890',
      pkp: true,
      bank: 'BCA',
      noRekening: '6150832452',
      rekeningAtasNama: 'UKHY DIAN',
      aktif: true,
    },
    {
      id: 'sup-2',
      name: 'PT. TENANG JAYA SEJAHTERA',
      idProgram: 'SUP-002',
      penerima: 'ARIF NURCAHYADI',
      telepon: '0811-9876-5432',
      pkp: true,
      bank: 'BCA',
      noRekening: '0503800800',
      rekeningAtasNama: 'ARIF NURCAHYADI',
      aktif: true,
    },
    {
      id: 'sup-3',
      name: 'PT SOYO APIK',
      idProgram: 'SUP-003',
      penerima: 'PT SOYO APIK',
      telepon: '0821-3344-5566',
      pkp: true,
      bank: 'BCA',
      noRekening: '829-189-1888',
      rekeningAtasNama: 'PT SOYO APIK',
      aktif: true,
    },
    {
      id: 'sup-4',
      name: 'PAK TEGUH (BARU)',
      idProgram: 'SUP-004',
      penerima: 'EKO WAHYUDI PRAYOGO',
      telepon: '0857-1122-3344',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415250533',
      rekeningAtasNama: 'EKO WAHYUDI PRAYOGO',
      aktif: true,
    },
    {
      id: 'sup-5',
      name: 'PAK TEGUH',
      idProgram: 'SUP-005',
      penerima: 'EKO WAHYUDI PRAYOGO',
      telepon: '0857-1122-3345',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415094256',
      rekeningAtasNama: 'EKO WAHYUDI PRAYOGO',
      aktif: true,
    },
    {
      id: 'sup-6',
      name: 'PAK KAMBYA',
      idProgram: 'SUP-006',
      penerima: 'KAMBYA',
      telepon: '0813-9988-7766',
      pkp: false,
      bank: 'BCA',
      noRekening: '4110777715',
      rekeningAtasNama: 'KAMBYA',
      aktif: true,
    },
    {
      id: 'sup-7',
      name: 'PAK HALIDI',
      idProgram: 'SUP-007',
      penerima: 'MOCHAMMAD HALIDI ARSYAD',
      telepon: '0812-8877-6655',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415281200',
      rekeningAtasNama: 'MOCHAMMAD HALIDI ARSYAD',
      aktif: true,
    },
    {
      id: 'sup-8',
      name: 'ADITA JUSTIA SAPUTRA',
      idProgram: 'SUP-008',
      penerima: 'PAK ADIT',
      telepon: '0822-6655-4433',
      pkp: false,
      bank: 'BCA',
      noRekening: '7415428618',
      rekeningAtasNama: 'ADITA JUSTIA SAPUTRA',
      aktif: true,
    },
  ]));

  // Data Customer per Screenshot cbe2d441 & e339cc44
  const [customers, setCustomers] = useState(() => loadStorage(STORAGE_KEYS.customers, [
    {
      id: 'cust-1',
      kodePrefix: 'LW 655',
      name: 'PT LION WINGS',
      jenisBadanUsaha: 'PT',
      alias: 'PT LION WINGS',
      alamat: 'KIG Blok C-12, Manyar, Gresik',
      npwp: '01.234.567.8-612.000',
      telepon: '031-3981122',
      aktif: true,
    },
    {
      id: 'cust-2',
      kodePrefix: 'SI 901',
      name: 'PT SEMEN INDONESIA',
      jenisBadanUsaha: 'PT',
      alias: 'PT SEMEN INDONESIA (PERSERO) TBK',
      alamat: 'Jl. Veteran, Gresik 61122',
      npwp: '01.001.605.3-093.000',
      telepon: '031-3981732',
      aktif: true,
    },
    {
      id: 'cust-3',
      kodePrefix: 'PG 102',
      name: 'PT PETROKIMIA GRESIK',
      jenisBadanUsaha: 'PT',
      alias: 'PT PETROKIMIA GRESIK',
      alamat: 'Jl. Jenderal Ahmad Yani, Gresik 61119',
      npwp: '01.000.013.3-051.000',
      telepon: '031-3977001',
      aktif: true,
    },
    {
      id: 'cust-4',
      kodePrefix: 'ADM 044',
      name: 'ASCO DWI MOBILINDO, PT',
      jenisBadanUsaha: 'PT',
      alias: 'PT ASCO DWI MOBILINDO',
      alamat: 'Kawasan Industri Manyar, Gresik',
      npwp: '01.001.611.1-093.000',
      telepon: '031-7992000',
      aktif: true,
    },
    {
      id: 'cust-5',
      kodePrefix: 'AS 734',
      name: 'PT ANEKA SISTEM',
      jenisBadanUsaha: 'PT',
      alias: 'PT ANEKA SISTEM ENERGI',
      alamat: 'Jl. Raya Manyar Km. 11, Gresik',
      npwp: '02.345.678.9-612.000',
      telepon: '031-3958800',
      aktif: true,
    },
    {
      id: 'cust-6',
      kodePrefix: 'BAS 724',
      name: 'PT BERKAH ALAM SEMESTA',
      jenisBadanUsaha: 'PT',
      alias: 'PT BERKAH ALAM SEMESTA',
      alamat: 'Gresik Hub, Jawa Timur',
      npwp: '03.456.789.0-612.000',
      telepon: '031-3980000',
      aktif: true,
    },
  ]));

  // Data Armada Dump Truck per Screenshot bf8de022 & d26f8f80
  const [armadaList, setArmadaList] = useState(() => loadStorage(STORAGE_KEYS.armada, [
    {
      id: 'arm-1',
      nopol: 'W 9821 UB',
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 200,
      kapasitas: 32.5,
      merk: 'Hino Dutro 130 HD',
      vin: 'MHM123456789',
      mesin: 'W04D-TN',
      tahun: 2021,
      aktif: true,
    },
    {
      id: 'arm-2',
      nopol: 'W 8812 UA',
      panjangCm: 620,
      lebarCm: 240,
      tinggiCm: 190,
      kapasitas: 28.27,
      merk: 'Isuzu Giga FVR',
      vin: 'ISZ987654321',
      mesin: '6HK1-TCS',
      tahun: 2022,
      aktif: true,
    },
    {
      id: 'arm-3',
      nopol: 'L 9402 UK',
      panjangCm: 640,
      lebarCm: 245,
      tinggiCm: 195,
      kapasitas: 30.58,
      merk: 'Mitsubishi Fuso Fighter',
      vin: 'MTS554433221',
      mesin: '6M60',
      tahun: 2020,
      aktif: true,
    },
    {
      id: 'arm-4',
      nopol: 'W 9041 ZN',
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 210,
      kapasitas: 34.13,
      merk: 'Hino Ranger FL',
      vin: 'HIN778899001',
      mesin: 'J08E-WD',
      tahun: 2023,
      aktif: true,
    },
    {
      id: 'arm-5',
      nopol: 'B 9110 TDA',
      panjangCm: 600,
      lebarCm: 230,
      tinggiCm: 180,
      kapasitas: 24.84,
      merk: 'Toyota Dyna 130HT',
      vin: 'TYT443322110',
      mesin: 'W04D-TM',
      tahun: 2019,
      aktif: true,
    },
    {
      id: 'arm-6',
      nopol: 'N 8820 UF',
      panjangCm: 660,
      lebarCm: 250,
      tinggiCm: 200,
      kapasitas: 33.0,
      merk: 'UD Trucks Quester',
      vin: 'UDT667788990',
      mesin: 'GH8E',
      tahun: 2022,
      aktif: true,
    },
    {
      id: 'arm-7',
      nopol: '21606',
      panjangCm: 650,
      lebarCm: 240,
      tinggiCm: 190,
      kapasitas: 29.64,
      merk: 'Internal Index 24',
      vin: 'INT112233445',
      mesin: 'IND-24-01',
      tahun: 2020,
      aktif: true,
    },
  ]));

  // Data Bank per Screenshot 6584ca21 & ef502847
  const [banks, setBanks] = useState(() => loadStorage(STORAGE_KEYS.banks, [
    {
      id: 'bank-1',
      namaBank: 'Bank Central Asia',
      namaAlias: 'BCA',
      kodeSwift: 'CENAIDJA',
      kodeBank: '014',
      aktif: true,
    },
    {
      id: 'bank-2',
      namaBank: 'Bank Mandiri',
      namaAlias: 'Mandiri',
      kodeSwift: 'BMRIIDJA',
      kodeBank: '008',
      aktif: true,
    },
    {
      id: 'bank-3',
      namaBank: 'Bank Rakyat Indonesia',
      namaAlias: 'BRI',
      kodeSwift: 'BRINIDJA',
      kodeBank: '002',
      aktif: true,
    },
    {
      id: 'bank-4',
      namaBank: 'Bank Negara Indonesia',
      namaAlias: 'BNI',
      kodeSwift: 'BNINIDJA',
      kodeBank: '009',
      aktif: true,
    },
  ]));

  // Data Rekening Bank PT BAS per Screenshot 5b565e7a
  const [bankAccounts, setBankAccounts] = useState(() => loadStorage(STORAGE_KEYS.bankAccounts, [
    {
      id: 'acc-1',
      bank: 'BCA',
      jenisRekening: 'Giro Bisnis',
      nomorRekening: '0188920199',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'BCA Operasional Gresik',
      aktif: true,
    },
    {
      id: 'acc-2',
      bank: 'Bank Mandiri',
      jenisRekening: 'Giro Utama',
      nomorRekening: '1420019283741',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'Mandiri Penerimaan Proyek',
      aktif: true,
    },
    {
      id: 'acc-3',
      bank: 'Bank Central Asia',
      jenisRekening: 'Tabungan Escrow',
      nomorRekening: '0503800800',
      rekeningAtasNama: 'PT Berkah Alam Semesta',
      namaAlias: 'BCA Cadangan Kas Supplier',
      aktif: true,
    },
  ]));

  // Data Mata Uang Sistem PT BAS
  const [currencies, setCurrencies] = useState(() =>
    loadStorage(STORAGE_KEYS.currencies, INITIAL_CURRENCIES)
  );

  // Data Pengguna (Users)
  const [usersList, setUsersList] = useState([
    { id: 'usr-1', name: 'David Rusiah', role: 'Super Admin', email: 'superadmin@ptbas.co.id', phone: '0811-3001-992', aktif: true },
  ]);

  // ==========================================
  // AUTO-PERSISTENCE TO LOCALSTORAGE
  // ==========================================
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(preOrders)); } catch (e) { }
  }, [preOrders]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(suratJalanList)); } catch (e) { }
  }, [suratJalanList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(bkkList)); } catch (e) { }
  }, [bkkList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoiceList)); } catch (e) { }
  }, [invoiceList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.materials, JSON.stringify(materials)); } catch (e) { }
  }, [materials]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers)); } catch (e) { }
  }, [suppliers]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers)); } catch (e) { }
  }, [customers]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.armada, JSON.stringify(armadaList)); } catch (e) { }
  }, [armadaList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.banks, JSON.stringify(banks)); } catch (e) { }
  }, [banks]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.bankAccounts, JSON.stringify(bankAccounts)); } catch (e) { }
  }, [bankAccounts]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.currencies, JSON.stringify(currencies)); } catch (e) { }
  }, [currencies]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(preOrders)); } catch (e) { }
  }, [preOrders]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(suratJalanList)); } catch (e) { }
  }, [suratJalanList]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(rekapanList)); } catch (e) { }
  }, [rekapanList]);

  // Sync with backend SQLite database on mount
  const fetchPreOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/pre-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPreOrders((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
            try {
              localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(data));
            } catch (e) {}
            return data;
          });
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, []);

  const fetchSuratJalan = useCallback(async () => {
    try {
      const res = await fetch('/api/surat-jalan');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned = data.filter(
            (s) =>
              s.id !== 'SJ-202611-0089' &&
              s.id !== 'SJ-202611-0090' &&
              s.id !== 'SJ-202611-0091' &&
              s.poNumber !== 'PO-LW-2026-089'
          );
          setSuratJalanList((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(cleaned)) return prev;
            try {
              localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(cleaned));
            } catch (e) {}
            return cleaned;
          });
        }
      }
    } catch (err) {}
  }, []);

  const fetchBkk = useCallback(async () => {
    try {
      const res = await fetch('/api/bkk');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned = data
            .filter(
              (b) =>
                !['co-1', 'co-2', 'co-3', 'co-4', 'co-5', 'bkk-0', 'bkk-1', 'bkk-2', 'bkk-3'].includes(b.id) &&
                !String(b.id || '').startsWith('dummy') &&
                !String(b.kodeTransaksi || '').includes('POS-2608') &&
                !String(b.kodeTransaksi || '').includes('POL-2607') &&
                !String(b.kodeTransaksi || '').includes('4500391980') &&
                !String(b.kodeTransaksi || '').includes('TRX-202611-00')
            )
            .map(normalizeBkkItem);
          setBkkList((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(cleaned)) return prev;
            try {
              localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(cleaned));
            } catch (e) {}
            return cleaned;
          });
        }
      }
    } catch (err) {}
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned = data
            .filter(
              (inv) =>
                !['inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6'].includes(inv.id) &&
                !String(inv.id || '').startsWith('dummy') &&
                !String(inv.kodeTransaksi || '').includes('POS-2608') &&
                !String(inv.kodeTransaksi || '').includes('POL-2607') &&
                !String(inv.kodeTransaksi || '').includes('4500391980') &&
                !String(inv.kodeTransaksi || '').includes('4510010537') &&
                !String(inv.kodeTransaksi || '').includes('4590011130')
            )
            .map(normalizeInvoiceItem);
          setInvoiceList((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(cleaned)) return prev;
            try {
              localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(cleaned));
            } catch (e) {}
            return cleaned;
          });
        }
      }
    } catch (err) {}
  }, []);

  const fetchRekapan = useCallback(async () => {
    try {
      const res = await fetch('/api/jurnal-gi');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const cleaned = data.filter(
            (r) =>
              r.id !== 'REK-202611-0001' &&
              r.id !== 'REK-202611-0002' &&
              r.poNumber !== 'PO-LW-2026-089' &&
              r.poNumber !== 'PO-SI-2026-014'
          );
          setRekapanList((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(cleaned)) return prev;
            try {
              localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(cleaned));
            } catch (e) {}
            return cleaned;
          });
        }
      }
    } catch (err) {}
  }, []);

  const fetchMasterData = async () => {
    try {
      const [matRes, supRes, custRes, armRes, bnkRes, accRes, currRes] = await Promise.allSettled([
        fetch('/api/master/materials').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/suppliers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/customers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/armada').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/banks').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/bank-accounts').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master/currencies').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (matRes.status === 'fulfilled' && Array.isArray(matRes.value) && matRes.value.length > 0) {
        setMaterials(matRes.value);
        try { localStorage.setItem(STORAGE_KEYS.materials, JSON.stringify(matRes.value)); } catch (e) {}
      }
      if (supRes.status === 'fulfilled' && Array.isArray(supRes.value) && supRes.value.length > 0) {
        setSuppliers(supRes.value);
        try { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(supRes.value)); } catch (e) {}
      }
      if (custRes.status === 'fulfilled' && Array.isArray(custRes.value) && custRes.value.length > 0) {
        setCustomers(custRes.value);
        try { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(custRes.value)); } catch (e) {}
      }
      if (armRes.status === 'fulfilled' && Array.isArray(armRes.value) && armRes.value.length > 0) {
        setArmadaList(armRes.value);
        try { localStorage.setItem(STORAGE_KEYS.armada, JSON.stringify(armRes.value)); } catch (e) {}
      }
      if (bnkRes.status === 'fulfilled' && Array.isArray(bnkRes.value) && bnkRes.value.length > 0) {
        setBanks(bnkRes.value);
        try { localStorage.setItem(STORAGE_KEYS.banks, JSON.stringify(bnkRes.value)); } catch (e) {}
      }
      if (accRes.status === 'fulfilled' && Array.isArray(accRes.value) && accRes.value.length > 0) {
        setBankAccounts(accRes.value);
        try { localStorage.setItem(STORAGE_KEYS.bankAccounts, JSON.stringify(accRes.value)); } catch (e) {}
      }
      if (currRes.status === 'fulfilled' && Array.isArray(currRes.value) && currRes.value.length > 0) {
        setCurrencies(currRes.value);
        try { localStorage.setItem(STORAGE_KEYS.currencies, JSON.stringify(currRes.value)); } catch (e) {}
      }
    } catch (err) {
      // Fall back to local storage cache smoothly
    }
  };

  // Sync master data and setup realtime cross-tab & cross-browser synchronization
  useEffect(() => {
    fetchMasterData();
    fetchPreOrders();
    fetchSuratJalan();
    fetchBkk();
    fetchInvoices();
    fetchRekapan();

    // 1. BroadcastChannel for instant cross-tab sync in same browser
    let channel = null;
    try {
      channel = new BroadcastChannel('ptbas_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_MASTER' || event.data?.type === 'SYNC_ALL') {
          fetchMasterData();
        }
        if (event.data?.type === 'SYNC_PREORDERS' || event.data?.type === 'SYNC_ALL') {
          fetchPreOrders();
        }
        if (event.data?.type === 'SYNC_SURAT_JALAN' || event.data?.type === 'SYNC_ALL') {
          fetchSuratJalan();
        }
        if (event.data?.type === 'SYNC_BKK' || event.data?.type === 'SYNC_ALL') {
          fetchBkk();
        }
        if (event.data?.type === 'SYNC_INVOICES' || event.data?.type === 'SYNC_ALL') {
          fetchInvoices();
        }
        if (event.data?.type === 'SYNC_REKAPAN' || event.data?.type === 'SYNC_ALL') {
          fetchRekapan();
        }
      };
    } catch (e) {}

    // 2. Storage event listener (same browser tabs fallback)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.preOrders && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPreOrders(parsed);
        } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.suratJalan && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSuratJalanList(parsed);
        } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.bkk && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setBkkList(parsed.map(normalizeBkkItem));
        } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.invoices && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setInvoiceList(parsed.map(normalizeInvoiceItem));
        } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.rekapan && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRekapanList(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Polling & Window Focus sync (handles incognito & separate browser windows)
    const handleFocus = () => {
      fetchMasterData();
      fetchPreOrders();
      fetchSuratJalan();
      fetchBkk();
      fetchInvoices();
      fetchRekapan();
    };
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      fetchPreOrders();
      fetchSuratJalan();
      fetchBkk();
      fetchInvoices();
      fetchRekapan();
    }, 10000); // 10-second background sync

    return () => {
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  // ==========================================
  // 3. ACTION DISPATCHERS
  // ==========================================

  // Pre Order Actions
  const createPreOrder = async (data) => {
    const id = (data.id && !isNaN(Number(data.id))) ? Number(data.id) : Date.now();
    const allRos = [...preOrders, ...suratJalanList, ...rekapanList];
    const nomorRO = data.nomorRO || generateNomorRO(data.customer, allRos, new Date(), customers);
    const newPo = {
      ...data,
      id,
      nomorRO,
      nomorPo: data.nomorPo || data.nomorPoCustomer || null, // Provided or generated on 1st SJ
      terkirim: Number(data.terkirim) || 0,
      status: 'MENUNGGU_APPROVAL',
      createdBy: data.createdBy || 'Admin Gresik',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    };

    // Optimistic update
    setPreOrders((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const updated = [newPo, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Notify other tabs
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'create', id });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      const res = await fetch('/api/pre-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPo),
      });
      if (res.ok) {
        const result = await res.json().catch(() => null);
        if (result?.data) {
          setPreOrders((prev) => {
            const updated = [result.data, ...prev.filter((p) => p.id !== id && p.id !== result.data.id)];
            try {
              localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        } else {
          await fetchPreOrders();
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Backend PO sync failed:', res.status, errJson);
        await fetchPreOrders();
        throw new Error(errJson.message || 'Gagal menyimpan Pre Order ke database');
      }
    } catch (err) {
      console.warn('Backend PO sync failed:', err);
      throw err;
    }

    addToast('Pre Order berhasil diajukan! Menunggu persetujuan Super Admin.', 'success');
    return newPo;
  };

  const approvePreOrder = async (id, approverName = 'David Rusiah (Direktur)') => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let approvedPo = null;

    // Optimistic update Pre Orders
    setPreOrders((prev) => {
      const allRos = [...prev, ...suratJalanList, ...rekapanList];
      const updated = prev.map((po) => {
        if (po.id === id) {
          const finalRo = po.nomorRO || generateNomorRO(po.customer, allRos, new Date(), customers);
          approvedPo = {
            ...po,
            nomorRO: finalRo,
            status: 'APPROVED',
            approvedBy: approverName,
            approvedAt: now,
            rejectionReason: null,
          };
          return approvedPo;
        }
        return po;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Otomatis buat / perbarui Jurnal Summary (Jurnal GI) untuk nomor RO pre-order ini
    setRekapanList((prev) => {
      const po = approvedPo || preOrders.find((p) => p.id === id);
      if (!po) return prev;
      const allRos = [...preOrders, ...suratJalanList, ...prev];
      const finalRo = po.nomorRO || generateNomorRO(po.customer, allRos, new Date(), customers);
      const exists = prev.some((r) => r.preOrderId === id || r.nomorRO === finalRo);
      if (exists) return prev;

      const targetVol = Number(po.totalOrder) || 0;
      const targetTrips = po.satuan === 'rit' ? Math.max(1, targetVol) : 0;
      const hBeli = Number(po.hargaBeli) || 0;
      const hJual = Number(po.hargaJual) || 0;
      const isPpn = po.jenisWajibPajak === 'PKP';

      const newJurnal = {
        id: `REK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`,
        nomorRO: finalRo,
        preOrderId: po.id,
        poNumber: po.nomorPo || 'MENUNGGU SURAT JALAN PERTAMA',
        customer: po.customer,
        customerAddress: po.customerAddress || '',
        material: po.materialName || 'SIRTU',
        isPpn,
        tanggal: po.tanggal || new Date().toISOString().split('T')[0],
        totalSj: 0,
        targetRitase: targetTrips,
        totalVolume: 0,
        targetVolume: targetVol,
        satuan: po.satuan || 'm3',
        hargaBeli: hBeli,
        hargaJual: hJual,
        nominalBeli: 0,
        nominalJual: 0,
        status: 'Siap Kirim',
        suratJalanDetails: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedRek = [newJurnal, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(updatedRek));
      } catch (e) {}
      return updatedRek;
    });

    // Notify other tabs immediately
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'approve', id });
      ch.postMessage({ type: 'SYNC_REKAPAN', action: 'approve', id });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      const res = await fetch(`/api/pre-orders/${encodeURIComponent(id)}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver: approverName }),
      });
      if (res.ok) {
        const resJson = await res.json().catch(() => null);
        if (resJson?.jurnal) {
          setRekapanList((prev) => {
            const exists = prev.some((r) => r.id === resJson.jurnal.id || r.nomorRO === resJson.jurnal.nomorRO);
            const updated = exists
              ? prev.map((r) => (r.id === resJson.jurnal.id || r.nomorRO === resJson.jurnal.nomorRO ? resJson.jurnal : r))
              : [resJson.jurnal, ...prev];
            try {
              localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
      await fetchPreOrders();
      await fetchRekapan();
    } catch (err) {
      console.warn('Backend PO approve sync failed, saved in localStorage:', err);
    }

    addToast('Pre Order resmi DISETUJUI! Surat Jalan kini dapat dibuat & Ringkasan Jurnal terbit.', 'success');
  };

  const rejectPreOrder = async (id, reason) => {
    // Optimistic update
    setPreOrders((prev) => {
      const updated = prev.map((po) => {
        if (po.id === id) {
          return {
            ...po,
            status: 'REJECTED',
            rejectionReason: reason || 'Harga atau kuota tidak sesuai',
          };
        }
        return po;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Notify other tabs immediately
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'reject', id });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      await fetch(`/api/pre-orders/${encodeURIComponent(id)}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      await fetchPreOrders();
    } catch (err) {
      console.warn('Backend PO reject sync failed, saved in localStorage:', err);
    }

    addToast('Pre Order ditolak dan dikembalikan untuk revisi.', 'error');
  };

  const updatePreOrderCustomerPo = async (id, poNumber, syncWaybills = true) => {
    const cleanPo = (poNumber && String(poNumber).trim() !== '') ? String(poNumber).trim().slice(0, 50) : null;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const user = getAuthUser();
    const updaterName = user?.name || 'Admin';

    let targetRoNum = '';

    // 1. Optimistic update in preOrders
    setPreOrders((prev) => {
      const updated = prev.map((po) => {
        if (po.id === id) {
          targetRoNum = po.nomorRO || '';
          return {
            ...po,
            nomorPo: cleanPo,
            nomorPoCustomer: cleanPo,
            poUpdatedBy: updaterName,
            poUpdatedAt: now,
          };
        }
        return po;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Optimistic update in suratJalanList & rekapanList if syncWaybills
    if (syncWaybills) {
      setSuratJalanList((prev) => {
        const updated = prev.map((sj) => {
          if (sj.preOrderId === id || (targetRoNum && sj.nomorRO === targetRoNum)) {
            return { ...sj, poNumber: cleanPo };
          }
          return sj;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setRekapanList((prev) => {
        const updated = prev.map((j) => {
          if (j.preOrderId === id || (targetRoNum && j.nomorRO === targetRoNum)) {
            return { ...j, poNumber: cleanPo };
          }
          return j;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    // 3. Broadcast to other tabs
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'update_po', id, poNumber: cleanPo });
      ch.close();
    } catch (e) {}

    // 4. Send PATCH to backend
    try {
      const res = await fetch(`/api/pre-orders/${encodeURIComponent(id)}/customer-po`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber: cleanPo,
          syncWaybills,
          updatedBy: updaterName,
        }),
      });

      if (res.ok) {
        const result = await res.json().catch(() => null);
        addToast(
          result?.message || (cleanPo ? `Nomor PO ${cleanPo} berhasil disimpan!` : 'Nomor PO berhasil dikosongkan.'),
          'success'
        );
        return result?.data;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Backend update customer PO failed:', res.status, errJson);
        addToast(errJson.message || 'Gagal menyimpan Nomor PO ke database', 'error');
        throw new Error(errJson.message || 'Gagal menyimpan Nomor PO ke database');
      }
    } catch (err) {
      console.warn('Backend update customer PO error:', err);
      throw err;
    }
  };

  const deletePreOrder = async (id) => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus Received Order.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus Received Order.' };
    }

    try {
      const res = await fetch(`/api/pre-orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menghapus Received Order: Akses ditolak.', 'error');
        await fetchPreOrders();
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn('Backend delete pre-order failed, updated in localStorage:', err);
    }

    setPreOrders((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'delete', id });
      ch.close();
    } catch (e) {}

    addToast('Data Received Order berhasil dihapus.', 'info');
    return { success: true };
  };

  // Surat Jalan Actions
  const createSuratJalan = async (sjData) => {
    // Strict enforcement: Validate PO approval status
    const targetPo = preOrders.find(
      (po) =>
        (po.nomorPo && po.nomorPo === sjData.poNumber) ||
        po.id === sjData.poNumber ||
        (po.nomorRO && (po.nomorRO === sjData.nomorRO || po.nomorRO === sjData.nomorRo))
    );

    if (targetPo && targetPo.status !== 'APPROVED') {
      addToast('Surat Jalan ditolak: Pre Order belum disetujui oleh Super Admin!', 'error');
      throw new Error('Pre Order belum disetujui');
    }

    const nextId = (suratJalanList.length > 0 ? Math.max(...suratJalanList.map((s) => Number(s.id) || 0)) : 0) + 1;
    const sjId = sjData.id ? Number(sjData.id) : nextId;

    const calc = calculateKubikasi(
      sjData.panjangCm,
      sjData.lebarCm,
      sjData.tinggiCm,
      sjData.koreksiTinggiCm || 0
    );

    const allRos = [...preOrders, ...suratJalanList, ...rekapanList];
    const finalNomorRo = targetPo?.nomorRO || sjData.nomorRO || sjData.nomorRo || generateNomorRO(sjData.customer, allRos, sjData.tanggal ? new Date(sjData.tanggal) : new Date(), customers);

    const allPos = [
      ...preOrders.map((p) => p.nomorPo || p.nomorPoCustomer),
      ...suratJalanList.map((s) => s.poNumber),
      ...rekapanList.map((r) => r.poNumber),
      ...invoiceList.map((i) => i.poNumber),
    ];

    const isNumericOrDraft = (str) => {
      if (!str) return true;
      const s = String(str).trim();
      return s === '' || s === 'MENUNGGU SURAT JALAN PERTAMA' || s.startsWith('PO-DRAFT-') || /^\d{10,}$/.test(s);
    };

    let assignedPoNum = null;
    if (sjData.poNumber && String(sjData.poNumber).trim() !== '' && !isNumericOrDraft(sjData.poNumber) && String(sjData.poNumber) !== String(targetPo?.id)) {
      assignedPoNum = String(sjData.poNumber).trim().slice(0, 50);
    } else if (targetPo?.nomorPo && !isNumericOrDraft(targetPo.nomorPo)) {
      assignedPoNum = String(targetPo.nomorPo).trim().slice(0, 50);
    } else if (sjData.autoGeneratePo) {
      assignedPoNum = generatePoNumber(sjData.customer, allPos, sjData.tanggal ? new Date(sjData.tanggal) : new Date(), customers);
    }

    const newSj = {
      ...sjData,
      id: sjId,
      poNumber: assignedPoNum,
      nomorRO: finalNomorRo,
      preOrderId: targetPo?.id || sjData.preOrderId || null,
      volumeAkhir: calc.volumeAkhir,
      statusRekap: 'DIREKAP',
    };

    // 1. Update Surat Jalan List
    setSuratJalanList((prev) => {
      const updated = [newSj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Update Pre Orders terkirim & auto-assign PO number if first delivery
    setPreOrders((prev) => {
      const updated = prev.map((po) => {
        const isMatch =
          po.id === targetPo?.id ||
          (po.nomorPo && po.nomorPo === sjData.poNumber) ||
          po.id === sjData.poNumber ||
          (po.nomorRO && finalNomorRo && po.nomorRO === finalNomorRo);

        if (isMatch) {
          return {
            ...po,
            nomorPo: assignedPoNum,
            terkirim: Number(((po.terkirim || 0) + calc.volumeAkhir).toFixed(2)),
          };
        }
        return po;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 3. Otomatis Sinkronkan Keterangan Surat Jalan ke Ringkasan Jurnal (Jurnal GI)
    setRekapanList((prev) => {
      let matched = false;

      const updated = prev.map((jrn) => {
        const isMatch =
          (jrn.preOrderId && targetPo && jrn.preOrderId === targetPo.id) ||
          (jrn.nomorRO && finalNomorRo && jrn.nomorRO === finalNomorRo) ||
          (jrn.poNumber && sjData.poNumber && jrn.poNumber === sjData.poNumber);

        if (isMatch) {
          matched = true;
          const existingDetails = Array.isArray(jrn.suratJalanDetails) ? jrn.suratJalanDetails : [];
          const sjItemDesc = {
            id: sjId,
            poNumber: assignedPoNum || jrn.poNumber,
            nomorRO: jrn.nomorRO || finalNomorRo,
            jurnalId: jrn.id,
            customer: sjData.customer,
            material: sjData.material,
            nopol: sjData.nopol || sjData.nomorPolisi || 'W 9821 UB',
            driver: sjData.driver || 'Supir Armada Terjadwal',
            tanggal: sjData.tanggal,
            waktu: sjData.waktu || '09:00',
            nomorNota: sjData.nomorNota || '',
            panjangCm: Number(sjData.panjangCm) || 0,
            lebarCm: Number(sjData.lebarCm) || 0,
            tinggiCm: Number(sjData.tinggiCm) || 0,
            koreksiTinggiCm: Number(sjData.koreksiTinggiCm) || 0,
            volumeAkhir: calc.volumeAkhir,
            status: 'Selesai',
          };

          const filteredDetails = existingDetails.filter((d) => d.id !== sjId);
          filteredDetails.push(sjItemDesc);

          const updatedTotalSj = filteredDetails.length;
          const updatedTotalVol = Number(filteredDetails.reduce((sum, d) => sum + (Number(d.volumeAkhir) || 0), 0).toFixed(2));
          const updatedNominalBeli = Math.round(updatedTotalVol * (Number(jrn.hargaBeli) || 0));
          const updatedNominalJual = Math.round(updatedTotalVol * (Number(jrn.hargaJual) || 0));
          const targetVol = Number(jrn.targetVolume) || 0;
          const isVolumeMet = targetVol > 0 && updatedTotalVol >= targetVol;
          const newStatus = isVolumeMet ? 'Selesai Kirim' : 'Dalam Pengiriman';

          return {
            ...jrn,
            poNumber: assignedPoNum || jrn.poNumber,
            totalSj: updatedTotalSj,
            totalVolume: updatedTotalVol,
            nominalBeli: updatedNominalBeli,
            nominalJual: updatedNominalJual,
            status: newStatus,
            suratJalanDetails: filteredDetails,
            updated_at: new Date().toISOString(),
          };
        }
        return jrn;
      });

      if (!matched) {
        // Jika belum ada rekapan sebelumnya, otomatis generate dan tempelkan surat jalan ini
        const targetVol = Number(targetPo?.totalOrder) || calc.volumeAkhir;
        const targetTrips = targetPo?.satuan === 'rit' ? Math.max(1, targetVol) : 0;
        const hBeli = Number(targetPo?.hargaBeli) || 40000;
        const hJual = Number(targetPo?.hargaJual) || 50000;
        const newRekId = `REK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;

        const sjItemDesc = {
          id: sjId,
          poNumber: assignedPoNum || sjData.poNumber,
          nomorRO: finalNomorRo,
          jurnalId: newRekId,
          customer: sjData.customer,
          material: sjData.material,
          nopol: sjData.nopol || sjData.nomorPolisi || 'W 9821 UB',
          driver: sjData.driver || 'Supir Armada Terjadwal',
          tanggal: sjData.tanggal,
          waktu: sjData.waktu || '09:00',
          nomorNota: sjData.nomorNota || '',
          panjangCm: Number(sjData.panjangCm) || 0,
          lebarCm: Number(sjData.lebarCm) || 0,
          tinggiCm: Number(sjData.tinggiCm) || 0,
          koreksiTinggiCm: Number(sjData.koreksiTinggiCm) || 0,
          volumeAkhir: calc.volumeAkhir,
          status: 'Selesai',
        };

        const isVolumeMet = targetVol > 0 && calc.volumeAkhir >= targetVol;
        const initialStatus = isVolumeMet ? 'Selesai Kirim' : 'Dalam Pengiriman';

        const newRek = {
          id: newRekId,
          nomorRO: finalNomorRo,
          preOrderId: targetPo?.id || null,
          poNumber: assignedPoNum || sjData.poNumber,
          customer: sjData.customer,
          customerAddress: targetPo?.customerAddress || '',
          material: sjData.material,
          isPpn: Boolean(sjData.isPpn),
          tanggal: sjData.tanggal,
          totalSj: 1,
          targetRitase: targetTrips,
          totalVolume: calc.volumeAkhir,
          targetVolume: targetVol,
          satuan: targetPo?.satuan || 'm3',
          hargaBeli: hBeli,
          hargaJual: hJual,
          nominalBeli: Math.round(calc.volumeAkhir * hBeli),
          nominalJual: Math.round(calc.volumeAkhir * hJual),
          status: initialStatus,
          suratJalanDetails: [sjItemDesc],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updated.unshift(newRek);
      }

      try {
        localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Notify other tabs
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_SURAT_JALAN', action: 'create', id: sjId });
      ch.postMessage({ type: 'SYNC_REKAPAN', action: 'create', id: sjId });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      const res = await fetch('/api/surat-jalan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSj),
      });
      if (res.ok) {
        const resJson = await res.json().catch(() => null);
        if (resJson?.jurnal) {
          setRekapanList((prev) => {
            const exists = prev.some((r) => r.id === resJson.jurnal.id || r.nomorRO === resJson.jurnal.nomorRO);
            const updated = exists
              ? prev.map((r) => (r.id === resJson.jurnal.id || r.nomorRO === resJson.jurnal.nomorRO ? resJson.jurnal : r))
              : [resJson.jurnal, ...prev];
            try {
              localStorage.setItem(STORAGE_KEYS.rekapan, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          addToast(errJson.message, 'error');
          throw new Error(errJson.message);
        }
      }
      await fetchSuratJalan();
      await fetchPreOrders();
      await fetchRekapan();
    } catch (err) {
      console.warn('Backend Surat Jalan sync failed, saved in localStorage:', err);
    }

    addToast(`Surat Jalan GI #${sjId} berhasil disimpan! (${calc.volumeAkhir} m³) & otomatis masuk ke Ringkasan Jurnal.`, 'success');
    return newSj;
  };

  // BKK Cash Out Actions
  const createBkk = async (bkkData) => {
    const user = getAuthUser();
    const createdBy = user?.name || user?.email || 'Admin';
    const id = bkkData.id || `BKK-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;

    const newBkkPayload = {
      ...bkkData,
      id,
      kodeTransaksi: bkkData.kodeTransaksi || `TRX-${Date.now()}`,
      statusBayar: 'Belum Dibayar',
      status: 'MENUNGGU_APPROVAL',
      createdBy,
    };

    try {
      const res = await fetch('/api/bkk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newBkkPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        const errorMsg = data.message || 'Gagal mengajukan BKK ke server.';
        addToast(errorMsg, 'error');
        return { success: false, message: errorMsg };
      }

      const normalized = normalizeBkkItem({
        ...newBkkPayload,
        kodeTransaksi: data.kodeTransaksi || newBkkPayload.kodeTransaksi,
        status: 'MENUNGGU_APPROVAL',
      });

      setBkkList((prev) => {
        const updated = [normalized, ...prev.filter((b) => b.id !== id)];
        try {
          localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_BKK' });
        ch.close();
      } catch (e) {}

      await fetchBkk();
      addToast(data.message || `BKK Cash Out ${normalized.kodeTransaksi} berhasil diajukan! (Status: Menunggu Approval)`, 'success');
      return { success: true, data: normalized };
    } catch (err) {
      const msg = err.message || 'Koneksi ke backend gagal saat membuat BKK.';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const approveBkk = async (bkkId, approverName = 'David Rusiah (Direktur)') => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menyetujui BKK.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menyetujui BKK.' };
    }

    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ approver: approverName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menyetujui BKK.', 'error');
        return { success: false, message: data.message };
      }

      const now = new Date().toISOString();
      setBkkList((prev) => {
        const updated = prev.map((item) =>
          item.id === bkkId
            ? {
                ...item,
                status: 'APPROVED',
                approvedBy: approverName,
                approvedAt: now,
                rejectionReason: null,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_BKK' });
        ch.close();
      } catch (e) {}

      await fetchBkk();
      addToast(data.message || 'BKK resmi disetujui & difinalisasi oleh Super Admin!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.warn('Approve BKK error:', err);
      addToast(err.message || 'Gagal menyetujui BKK.', 'error');
      return { success: false, message: err.message };
    }
  };

  const rejectBkk = async (bkkId, reason = 'Ditolak oleh Super Admin', rejecterName = 'David Rusiah (Direktur)') => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menolak BKK.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menolak BKK.' };
    }

    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reason, approver: rejecterName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menolak BKK.', 'error');
        return { success: false, message: data.message };
      }

      const now = new Date().toISOString();
      setBkkList((prev) => {
        const updated = prev.map((item) =>
          item.id === bkkId
            ? {
                ...item,
                status: 'REJECTED',
                rejectionReason: reason,
                approvedBy: rejecterName,
                approvedAt: now,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_BKK' });
        ch.close();
      } catch (e) {}

      await fetchBkk();
      addToast(data.message || 'BKK telah ditolak.', 'info');
      return { success: true, data: data.data };
    } catch (err) {
      console.warn('Reject BKK error:', err);
      addToast(err.message || 'Gagal menolak BKK.', 'error');
      return { success: false, message: err.message };
    }
  };

  const markBkkPaid = async (bkkIds, paymentDetails) => {
    // Client-side verification: Only APPROVED BKK can be paid
    const unapprovedItems = bkkList.filter((b) => bkkIds.includes(b.id) && b.status !== 'APPROVED');
    if (unapprovedItems.length > 0) {
      addToast(
        `Akses ditolak: Terdapat ${unapprovedItems.length} BKK yang belum disetujui oleh Super Admin. BKK harus berstatus Disetujui (Approved) sebelum dapat dicairkan/dibayar.`,
        'error'
      );
      return { success: false, message: 'BKK belum disetujui Super Admin' };
    }

    const tgl = paymentDetails?.tanggalBayar || new Date().toISOString().split('T')[0];
    const rek = paymentDetails?.rekeningSumber || 'BCA - 0188920199 a/n PT Berkah Alam Semesta';

    setBkkList((prev) => {
      const updated = prev.map((item) => {
        if (bkkIds.includes(item.id)) {
          return {
            ...item,
            statusBayar: 'Lunas',
            tanggalBayar: tgl,
            rekeningSumber: rek,
          };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const res = await fetch('/api/bkk/pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          ids: bkkIds,
          tanggalBayar: tgl,
          rekeningSumber: rek,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal mencatat pelunasan BKK.', 'error');
        await fetchBkk();
        return;
      }
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_BKK' });
      ch.close();
      await fetchBkk();
    } catch (e) {}
    addToast(`${bkkIds.length} BKK berhasil dicatat LUNAS! Hutang supplier diperbarui.`, 'success');
  };

  // Fetch available orders for BKK (Live from backend database)
  const fetchAvailableOrdersForBkk = useCallback(async () => {
    try {
      const res = await fetch('/api/bkk/available-orders');
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Error fetching available orders for BKK:', e);
    }
    return [];
  }, []);

  // Fetch BKK print data (Live from backend database with grouped GI by date)
  const fetchBkkPrintData = useCallback(async (bkkId) => {
    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/print-data`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.error('Error fetching BKK print data:', e);
    }
    return null;
  }, []);

  // Record BKK print event in audit trail
  const recordBkkPrint = useCallback(async (bkkId) => {
    try {
      await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/record-print`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.warn('Failed to record print audit:', e);
    }
  }, []);

  // Upload signed document for BKK
  const uploadBkkDocument = useCallback(async (bkkId, docPayload) => {
    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(docPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal mengunggah berkas dokumen.', 'error');
        return { success: false, message: data.message };
      }
      await fetchBkk();
      addToast(data.message || 'Dokumen fisik berhasil diunggah.', 'success');
      return { success: true, data: data.data, document: data.data };
    } catch (err) {
      console.error('Upload document error:', err);
      addToast(err.message || 'Gagal mengunggah dokumen.', 'error');
      return { success: false, message: err.message };
    }
  }, [fetchBkk]);

  // Submit signed document for Superadmin verification
  const submitBkkDocumentForVerification = async (bkkId) => {
    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/submit-verification`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal mengajukan verifikasi dokumen.', 'error');
        return { success: false, message: data.message };
      }
      await fetchBkk();
      addToast(data.message || 'Dokumen berhasil diajukan untuk verifikasi Superadmin!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Submit verification error:', err);
      addToast(err.message || 'Gagal mengajukan verifikasi.', 'error');
      return { success: false, message: err.message };
    }
  };

  // Superadmin approves signed document verification and finalizes as PAID (LUNAS)
  const approveBkkVerification = useCallback(async (bkkId, payload = {}) => {
    const user = getAuthUser();
    const isSA = user ? isUserSuperAdmin(user) : true;
    if (!isSA) {
      addToast('Akses ditolak: Hanya Super Admin yang berwenang memverifikasi dokumen fisik BKK.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang berwenang.' };
    }

    const bodyPayload = typeof payload === 'string'
      ? { verifier: payload }
      : (payload && typeof payload === 'object' ? { ...payload } : {});

    if (!bodyPayload.verifier) {
      bodyPayload.verifier = `${user?.name || user?.nama || 'David Rusiah'} (Super Admin / Direktur)`;
    }

    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/verify-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal memverifikasi dokumen BKK.', 'error');
        return { success: false, message: data.message };
      }

      // Optimistic update of local state
      const nowIso = new Date().toISOString();
      const settlementDate = bodyPayload.tanggalBayar || nowIso.split('T')[0];
      setBkkList((prev) => {
        const updated = prev.map((item) =>
          item.id === bkkId
            ? {
                ...item,
                status: 'paid',
                statusBayar: 'Lunas',
                tanggalBayar: settlementDate,
                verifiedBy: bodyPayload.verifier,
                verifiedAt: nowIso,
                latestDocument: item.latestDocument
                  ? { ...item.latestDocument, status: 'VERIFIED', verifiedBy: bodyPayload.verifier, verifiedAt: nowIso }
                  : item.latestDocument,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_BKK' });
        ch.close();
      } catch (e) {}

      await fetchBkk();
      addToast(data.message || 'Dokumen BKK resmi diverifikasi & transaksi difinalisasi LUNAS!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Approve verification error:', err);
      addToast(err.message || 'Gagal memverifikasi dokumen.', 'error');
      return { success: false, message: err.message };
    }
  }, [fetchBkk, addToast]);

  // Superadmin rejects signed document verification and requests revision
  const rejectBkkVerification = useCallback(async (bkkId, payload, verifierArg) => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang berwenang menolak verifikasi dokumen BKK.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang berwenang.' };
    }

    let reason = '';
    let verifier = verifierArg || `${user?.name || user?.nama || 'David Rusiah'} (Super Admin / Direktur)`;
    if (typeof payload === 'string') {
      reason = payload;
    } else if (payload && typeof payload === 'object') {
      reason = payload.reason || payload.alasan || '';
      if (payload.verifier) verifier = payload.verifier;
    }

    if (!reason || !reason.trim()) {
      addToast('Alasan penolakan / revisi dokumen wajib diisi.', 'error');
      return { success: false, message: 'Alasan penolakan wajib diisi' };
    }

    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/verify-reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason: reason.trim(), verifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menolak verifikasi dokumen.', 'error');
        return { success: false, message: data.message };
      }

      // Optimistic update of local state
      const nowIso = new Date().toISOString();
      setBkkList((prev) => {
        const updated = prev.map((item) =>
          item.id === bkkId
            ? {
                ...item,
                status: 'revision_required',
                rejectionReason: reason.trim(),
                latestDocument: item.latestDocument
                  ? { ...item.latestDocument, status: 'REJECTED', rejectionReason: reason.trim() }
                  : item.latestDocument,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_BKK' });
        ch.close();
      } catch (e) {}

      await fetchBkk();
      addToast(data.message || 'Verifikasi dokumen ditolak dan permintaan revisi diteruskan ke Admin.', 'info');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Reject verification error:', err);
      addToast(err.message || 'Gagal menolak verifikasi.', 'error');
      return { success: false, message: err.message };
    }
  }, [fetchBkk, addToast]);

  // Fetch document history & versions for a BKK
  const fetchBkkDocuments = useCallback(async (bkkId) => {
    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/documents`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Error fetching BKK documents:', e);
    }
    return [];
  }, []);

  // Fetch immutable audit trail for a BKK
  const fetchBkkAuditTrail = useCallback(async (bkkId) => {
    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}/audit-trail`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Error fetching BKK audit trail:', e);
    }
    return [];
  }, []);

  const deleteBkk = async (bkkId) => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus BKK (Cash Out).', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus BKK (Cash Out).' };
    }

    try {
      const res = await fetch(`/api/bkk/${encodeURIComponent(bkkId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menghapus BKK: Akses ditolak.', 'error');
        await fetchBkk();
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn('Backend delete BKK failed:', err);
    }

    setBkkList((prev) => {
      const updated = prev.filter((item) => item.id !== bkkId);
      try {
        localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_BKK' });
      ch.close();
    } catch (e) {}

    addToast('BKK kas keluar berhasil dihapus', 'info');
    return { success: true };
  };

  // ------------------------------------------
  // INVOICE HELPERS & WORKFLOW ACTIONS
  // ------------------------------------------
  const fetchAvailableOrdersForInvoice = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices/available-orders');
      if (res.ok) {
        const json = await res.json();
        const rawOrders = json.data || [];
        // Normalize field names so the UI can consistently use customerName / hargaSatuan
        const normalized = rawOrders.map((o) => ({
          ...o,
          customerName: o.customerName || o.defaultCustomerName || o.customer || '-',
          customerAddress: o.customerAddress || o.defaultCustomerAddress || '',
          customerNpwp: o.customerNpwp || o.defaultCustomerNpwp || '',
          hargaSatuan: Number(o.hargaSatuan || o.hargaJual || 0),
          totalVolume: Number(o.totalVolume || 0),
        }));
        return { success: true, data: normalized };
      }
    } catch (err) {
      console.error('Failed to fetch available orders for Invoice:', err);
    }
    return { success: false, data: [] };
  }, []);

  const createInvoice = async (invData) => {
    const user = getAuthUser();
    const createdBy = user?.name || user?.email || 'Admin';
    const id = invData.id || `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Date.now()).slice(-4)}`;

    const newInvPayload = {
      ...invData,
      id,
      // Ensure server-compatible field names for customer
      customer: invData.customer || invData.customerName || invData.perusahaan || '-',
      perusahaan: invData.perusahaan || invData.customerName || invData.customer || '-',
      // Map form tax fields to server-compatible names
      subtotalJasa: Number(invData.dpp || invData.subtotalJasa || 0),
      ppnNominal: Number(invData.ppn || invData.ppnNominal || 0),
      pphNominal: Number(invData.pph || invData.pphNominal || 0),
      npwp: invData.npwp || invData.customerNpwp || '',
      kodeTransaksi: invData.kodeTransaksi || invData.nomorInvoice || `INV-${Date.now()}`,
      statusBayar: 'Belum Dibayar',
      status: 'pending_approval',
      createdBy,
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newInvPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        const errorMsg = data.message || 'Gagal membuat Invoice di server.';
        addToast(errorMsg, 'error');
        return { success: false, message: errorMsg };
      }

      const normalized = normalizeInvoiceItem({
        ...newInvPayload,
        kodeTransaksi: data.kodeTransaksi || newInvPayload.kodeTransaksi,
        status: 'pending_approval',
      });

      setInvoiceList((prev) => {
        const updated = [normalized, ...prev.filter((i) => i.id !== id)];
        try {
          localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_INVOICES' });
        ch.close();
      } catch (e) {}

      await fetchInvoices();
      addToast(data.message || `Faktur Invoice ${normalized.kodeTransaksi} berhasil diajukan! (Status: Menunggu Approval)`, 'success');
      return { success: true, data: normalized };
    } catch (err) {
      const msg = err.message || 'Koneksi ke backend gagal saat membuat Invoice.';
      addToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const approveInvoice = async (invoiceId, approverName = 'David Rusiah (Direktur)') => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menyetujui Faktur Invoice.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menyetujui Faktur Invoice.' };
    }

    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ approver: approverName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menyetujui Invoice.', 'error');
        return { success: false, message: data.message };
      }

      const now = new Date().toISOString();
      setInvoiceList((prev) => {
        const updated = prev.map((item) =>
          item.id === invoiceId
            ? {
                ...item,
                status: 'approved',
                approvedBy: approverName,
                approvedAt: now,
                rejectionReason: null,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_INVOICES' });
        ch.close();
      } catch (e) {}

      await fetchInvoices();
      addToast(data.message || 'Invoice resmi disetujui & siap cetak!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.warn('Approve Invoice error:', err);
      addToast(err.message || 'Gagal menyetujui Invoice.', 'error');
      return { success: false, message: err.message };
    }
  };

  const rejectInvoice = async (invoiceId, reason = 'Ditolak oleh Super Admin') => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menolak Faktur Invoice.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menolak Faktur Invoice.' };
    }

    try {
      const approver = user?.name || user?.email || 'David Rusiah (Super Admin)';
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reason, approver }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menolak Invoice.', 'error');
        return { success: false, message: data.message };
      }

      setInvoiceList((prev) => {
        const updated = prev.map((item) =>
          item.id === invoiceId
            ? {
                ...item,
                status: 'rejected',
                rejectionReason: reason,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_INVOICES' });
        ch.close();
      } catch (e) {}

      await fetchInvoices();
      addToast(data.message || 'Invoice telah ditolak oleh Super Admin.', 'info');
      return { success: true, data: data.data };
    } catch (err) {
      console.warn('Reject Invoice error:', err);
      addToast(err.message || 'Gagal menolak Invoice.', 'error');
      return { success: false, message: err.message };
    }
  };

  const fetchInvoicePrintData = useCallback(async (invoiceId) => {
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/print-data`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.error('Error fetching Invoice print data:', err);
    }
    return null;
  }, []);

  const recordInvoicePrint = useCallback(async (invoiceId) => {
    try {
      const user = getAuthUser();
      await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/record-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ printer: user?.name || user?.email || 'Admin' }),
      });
      await fetchInvoices();
    } catch (err) {
      console.error('Error recording Invoice print:', err);
    }
  }, [fetchInvoices]);

  const uploadInvoiceDocument = async (invoiceId, docPayload) => {
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(docPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal mengunggah dokumen fisik Invoice.', 'error');
        return { success: false, message: data.message };
      }
      await fetchInvoices();
      addToast(data.message || 'Dokumen fisik berhasil diunggah.', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Upload Invoice document error:', err);
      addToast(err.message || 'Gagal mengunggah berkas dokumen.', 'error');
      return { success: false, message: err.message };
    }
  };

  const submitInvoiceDocumentForVerification = async (invoiceId) => {
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/submit-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal mengajukan verifikasi dokumen Invoice.', 'error');
        return { success: false, message: data.message };
      }
      await fetchInvoices();
      addToast(data.message || 'Dokumen berhasil diajukan untuk verifikasi Superadmin!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Submit Invoice verification error:', err);
      addToast(err.message || 'Gagal mengajukan verifikasi.', 'error');
      return { success: false, message: err.message };
    }
  };

  const approveInvoiceVerification = useCallback(async (invoiceId, payload = {}) => {
    const user = getAuthUser();
    const isSA = user ? isUserSuperAdmin(user) : true;
    if (!isSA) {
      addToast('Akses ditolak: Hanya Super Admin yang berwenang memverifikasi dokumen fisik Invoice.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang berwenang.' };
    }

    const bodyPayload = typeof payload === 'string'
      ? { verifier: payload }
      : (payload && typeof payload === 'object' ? { ...payload } : {});

    if (!bodyPayload.verifier) {
      bodyPayload.verifier = `${user?.name || user?.nama || 'David Rusiah'} (Super Admin / Direktur)`;
    }

    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/verify-approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal memverifikasi dokumen Invoice.', 'error');
        return { success: false, message: data.message };
      }

      const nowIso = new Date().toISOString();
      const settlementDate = bodyPayload.tanggalBayar || nowIso.split('T')[0];
      setInvoiceList((prev) => {
        const updated = prev.map((item) =>
          item.id === invoiceId
            ? {
                ...item,
                status: 'paid',
                statusBayar: 'Lunas',
                tanggalBayar: settlementDate,
                verifiedBy: bodyPayload.verifier,
                verifiedAt: nowIso,
                latestDocument: item.latestDocument
                  ? { ...item.latestDocument, status: 'VERIFIED', verifiedBy: bodyPayload.verifier, verifiedAt: nowIso }
                  : item.latestDocument,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_INVOICES' });
        ch.close();
      } catch (e) {}

      await fetchInvoices();
      addToast(data.message || 'Dokumen Invoice resmi diverifikasi & status berubah menjadi LUNAS!', 'success');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Approve Invoice verification error:', err);
      addToast(err.message || 'Gagal memverifikasi dokumen.', 'error');
      return { success: false, message: err.message };
    }
  }, [fetchInvoices, addToast]);

  const rejectInvoiceVerification = useCallback(async (invoiceId, payload, verifierArg) => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang berwenang menolak verifikasi dokumen Invoice.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang berwenang.' };
    }

    let reason = '';
    let verifier = verifierArg || `${user?.name || user?.nama || 'David Rusiah'} (Super Admin / Direktur)`;
    if (typeof payload === 'string') {
      reason = payload;
    } else if (payload && typeof payload === 'object') {
      reason = payload.reason || payload.alasan || '';
      if (payload.verifier) verifier = payload.verifier;
    }

    if (!reason || !reason.trim()) {
      addToast('Alasan penolakan / revisi dokumen wajib diisi.', 'error');
      return { success: false, message: 'Alasan penolakan wajib diisi' };
    }

    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/verify-reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason: reason.trim(), verifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menolak verifikasi dokumen Invoice.', 'error');
        return { success: false, message: data.message };
      }

      setInvoiceList((prev) => {
        const updated = prev.map((item) =>
          item.id === invoiceId
            ? {
                ...item,
                status: 'revision_required',
                rejectionReason: reason.trim(),
                latestDocument: item.latestDocument
                  ? { ...item.latestDocument, status: 'REJECTED', rejectionReason: reason.trim() }
                  : item.latestDocument,
              }
            : item
        );
        try {
          localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        const ch = new BroadcastChannel('ptbas_sync_channel');
        ch.postMessage({ type: 'SYNC_INVOICES' });
        ch.close();
      } catch (e) {}

      await fetchInvoices();
      addToast(data.message || 'Verifikasi dokumen ditolak dan permintaan revisi diteruskan ke Admin.', 'info');
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Reject Invoice verification error:', err);
      addToast(err.message || 'Gagal menolak verifikasi.', 'error');
      return { success: false, message: err.message };
    }
  }, [fetchInvoices, addToast]);

  const fetchInvoiceDocuments = useCallback(async (invoiceId) => {
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/documents`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Error fetching Invoice documents:', e);
    }
    return [];
  }, []);

  const fetchInvoiceAuditTrail = useCallback(async (invoiceId) => {
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/audit-trail`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.error('Error fetching Invoice audit trail:', e);
    }
    return [];
  }, []);

  const markInvoicePaid = async (invIds, paymentDetails) => {
    const tgl = paymentDetails?.tanggalBayar || new Date().toISOString().split('T')[0];
    setInvoiceList((prev) => {
      const updated = prev.map((item) =>
        invIds.includes(item.id) ? { ...item, statusBayar: 'Lunas', tanggalBayar: tgl } : item
      );
      try {
        localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await fetch('/api/invoices/pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: invIds, tanggalBayar: tgl }),
      });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_INVOICES' });
      ch.close();
      await fetchInvoices();
    } catch (e) {}

    addToast(`${invIds.length} Invoice berhasil dicatat LUNAS!`, 'success');
  };

  const deleteInvoice = async (invId) => {
    const user = getAuthUser();
    if (!isUserSuperAdmin(user)) {
      addToast('Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus Invoice.', 'error');
      return { success: false, message: 'Akses ditolak: Hanya Super Admin yang diizinkan untuk menghapus Invoice.' };
    }

    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        addToast(data.message || 'Gagal menghapus Invoice: Akses ditolak.', 'error');
        await fetchInvoices();
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn('Backend delete invoice failed:', err);
    }

    setInvoiceList((prev) => {
      const updated = prev.filter((item) => item.id !== invId);
      try {
        localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_INVOICES' });
      ch.close();
      await fetchInvoices();
    } catch (e) {}

    addToast('Invoice berhasil dihapus', 'info');
    return { success: true };
  };

  // ------------------------------------------
  // MASTER DATA CRUD HELPERS
  // ------------------------------------------

  // Material CRUD
  const toggleMaterialStatus = (id) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, aktif: !m.aktif } : m))
    );
    fetch(`/api/master/materials/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling material:', e)
    );
    addToast('Status material berhasil diubah', 'info');
  };

  const addMaterial = (newMat) => {
    const item = {
      ...newMat,
      id: newMat.id || `mat-${Date.now()}`,
      beli: Number(newMat.beli) || 0,
      jual: Number(newMat.jual) || 0,
      pphRate: newMat.category === 'Padat' ? 2.65 : 2.0,
      satuan: newMat.satuan || 'm3',
      aktif: newMat.aktif !== undefined ? newMat.aktif : true,
    };
    setMaterials((prev) => [...prev, item]);
    fetch('/api/master/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding material:', e));
    addToast(`Material "${item.name}" berhasil ditambahkan!`, 'success');
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    fetch(`/api/master/materials/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting material:', e)
    );
    addToast('Material berhasil dihapus', 'info');
  };

  const updateMaterial = (id, updatedData) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
            ...m,
            ...updatedData,
            beli: updatedData.beli !== undefined ? Number(updatedData.beli) : m.beli,
            jual: updatedData.jual !== undefined ? Number(updatedData.jual) : m.jual,
          }
          : m
      )
    );
    fetch(`/api/master/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating material:', e));
    addToast('Data material berhasil diperbarui!', 'success');
  };

  // Supplier CRUD
  const toggleSupplierStatus = (id) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, aktif: !s.aktif } : s))
    );
    fetch(`/api/master/suppliers/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling supplier:', e)
    );
    addToast('Status supplier berhasil diubah', 'info');
  };

  const addSupplier = async (newSup) => {
    const item = {
      ...newSup,
      id: newSup.id || `sup-${Date.now()}`,
      aktif: newSup.aktif !== undefined ? newSup.aktif : true,
    };
    setSuppliers((prev) => {
      const updated = [...prev, item];
      try { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch('/api/master/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error adding supplier:', e);
    }
    addToast(`Supplier "${item.name}" berhasil disimpan!`, 'success');
  };

  const deleteSupplier = async (id) => {
    setSuppliers((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch(`/api/master/suppliers/${id}`, { method: 'DELETE' });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error deleting supplier:', e);
    }
    addToast('Supplier berhasil dihapus', 'info');
  };

  const updateSupplier = async (id, updatedData) => {
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s));
      try { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch(`/api/master/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error updating supplier:', e);
    }
    addToast('Data supplier berhasil diperbarui!', 'success');
  };

  // Customer CRUD
  const toggleCustomerStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, aktif: !c.aktif } : c))
    );
    fetch(`/api/master/customers/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling customer:', e)
    );
    addToast('Status customer berhasil diubah', 'info');
  };

  const addCustomer = async (newCust) => {
    const jbuPrefix = (newCust.jenisBadanUsaha || '').split('-')[0] || newCust.jenisBadanUsaha;
    const item = {
      ...newCust,
      id: newCust.id || `cust-${Date.now()}`,
      aktif: newCust.aktif !== undefined ? newCust.aktif : true,
      alias: newCust.alias || `${jbuPrefix} ${newCust.name}`.trim(),
    };
    setCustomers((prev) => {
      const updated = [...prev, item];
      try { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch('/api/master/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error adding customer:', e);
    }
    addToast(`Customer "${item.name}" berhasil disimpan!`, 'success');
  };

  const updateCustomer = async (id, updatedData) => {
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      try { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch(`/api/master/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error updating customer:', e);
    }
    addToast('Data customer berhasil diperbarui!', 'success');
  };

  const deleteCustomer = async (id) => {
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch(`/api/master/customers/${id}`, { method: 'DELETE' });
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_MASTER' });
      ch.close();
      await fetchMasterData();
    } catch (e) {
      console.error('Error deleting customer:', e);
    }
    addToast('Customer berhasil dihapus', 'info');
  };

  // Armada CRUD
  const toggleArmadaStatus = (id) => {
    setArmadaList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, aktif: !a.aktif } : a))
    );
    fetch(`/api/master/armada/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling armada:', e)
    );
    addToast('Status armada berhasil diubah', 'info');
  };

  const addArmada = (newArmada) => {
    const p = Number(newArmada.panjangCm) || 0;
    const l = Number(newArmada.lebarCm) || 0;
    const t = Number(newArmada.tinggiCm) || 0;
    const kapasitas = Number(((p * l * t) / 1000000).toFixed(2));

    const item = {
      ...newArmada,
      id: newArmada.id || `arm-${Date.now()}`,
      kapasitas,
      aktif: newArmada.aktif !== undefined ? newArmada.aktif : true,
    };
    setArmadaList((prev) => [...prev, item]);
    fetch('/api/master/armada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding armada:', e));
    addToast(`Armada "${item.nopol}" (${kapasitas} m³) berhasil ditambahkan!`, 'success');
  };

  const deleteArmada = (id) => {
    setArmadaList((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/master/armada/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting armada:', e)
    );
    addToast('Armada berhasil dihapus', 'info');
  };

  const updateArmada = (id, updatedData) => {
    setArmadaList((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const p = updatedData.panjangCm !== undefined ? Number(updatedData.panjangCm) : a.panjangCm;
        const l = updatedData.lebarCm !== undefined ? Number(updatedData.lebarCm) : a.lebarCm;
        const t = updatedData.tinggiCm !== undefined ? Number(updatedData.tinggiCm) : a.tinggiCm;
        const kapasitas = Number(((p * l * t) / 1000000).toFixed(2));
        return {
          ...a,
          ...updatedData,
          panjangCm: p,
          lebarCm: l,
          tinggiCm: t,
          kapasitas,
        };
      })
    );
    fetch(`/api/master/armada/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating armada:', e));
    addToast('Data armada berhasil diperbarui!', 'success');
  };

  // Bank CRUD
  const toggleBankStatus = (id) => {
    setBanks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, aktif: !b.aktif } : b))
    );
    fetch(`/api/master/banks/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling bank:', e)
    );
    addToast('Status bank berhasil diubah', 'info');
  };

  const addBank = (newBank) => {
    const item = {
      ...newBank,
      id: newBank.id || `bank-${Date.now()}`,
      aktif: newBank.aktif !== undefined ? newBank.aktif : true,
    };
    setBanks((prev) => [...prev, item]);
    fetch('/api/master/banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding bank:', e));
    addToast(`Bank "${item.namaBank}" berhasil ditambahkan!`, 'success');
  };

  const deleteBank = (id) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
    fetch(`/api/master/banks/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting bank:', e)
    );
    addToast('Bank berhasil dihapus', 'info');
  };

  const updateBank = (id, updatedData) => {
    setBanks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
            ...b,
            ...updatedData,
          }
          : b
      )
    );
    fetch(`/api/master/banks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating bank:', e));
    addToast('Data bank berhasil diperbarui!', 'success');
  };

  // Bank Account CRUD
  const toggleBankAccountStatus = (id) => {
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, aktif: !a.aktif } : a))
    );
    fetch(`/api/master/bank-accounts/${id}/toggle`, { method: 'PATCH' }).catch((e) =>
      console.error('Error toggling bank account:', e)
    );
    addToast('Status rekening berhasil diubah', 'info');
  };

  const addBankAccount = (newAcc) => {
    const item = {
      ...newAcc,
      id: newAcc.id || `acc-${Date.now()}`,
      aktif: newAcc.aktif !== undefined ? newAcc.aktif : true,
    };
    setBankAccounts((prev) => [...prev, item]);
    fetch('/api/master/bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding bank account:', e));
    addToast(`Rekening "${item.nomorRekening}" berhasil ditambahkan!`, 'success');
  };

  const updateBankAccount = (id, updatedData) => {
    setBankAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
            ...a,
            ...updatedData,
          }
          : a
      )
    );
    fetch(`/api/master/bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating bank account:', e));
    addToast('Data rekening berhasil diperbarui!', 'success');
  };

  const deleteBankAccount = (id) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/master/bank-accounts/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting bank account:', e)
    );
    addToast('Rekening bank berhasil dihapus', 'info');
  };

  // Currency CRUD
  const toggleCurrencyStatus = (id) => {
    const target = currencies.find((c) => c.id === id || c.code === id);
    if (!target) return;

    if (target.isBase || target.code === 'IDR') {
      addToast('Mata uang basis (IDR) merupakan acuan pembukuan dan tidak dapat dinonaktifkan.', 'warning');
      return;
    }

    const nextAktif = !target.aktif;
    setCurrencies((prev) =>
      prev.map((c) => (c.id === target.id ? { ...c, aktif: nextAktif } : c))
    );

    fetch(`/api/master/currencies/${target.id}/toggle`, {
      method: 'PATCH',
    }).catch((err) => console.error('Error toggling currency:', err));

    addToast(`Status mata uang ${target.code} berhasil ${nextAktif ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
  };

  const addCurrency = (newCurr) => {
    const code = (newCurr.code || '').toUpperCase().trim();
    const id = newCurr.id || `curr-${code.toLowerCase()}`;
    const item = {
      ...newCurr,
      id,
      code,
      symbol: newCurr.symbol || code,
      isBase: false,
      aktif: newCurr.aktif !== undefined ? newCurr.aktif : true,
      lingkupModul: Array.isArray(newCurr.lingkupModul)
        ? newCurr.lingkupModul
        : ['Pre Order Customer', 'Kontrak Vendor Valas'],
    };

    setCurrencies((prev) => [...prev, item]);

    fetch('/api/master/currencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((err) => console.error('Error adding currency:', err));

    addToast(`Mata uang "${item.code} (${item.name})" berhasil ditambahkan!`, 'success');
  };

  const updateCurrency = (id, updatedData) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );

    fetch(`/api/master/currencies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((err) => console.error('Error updating currency:', err));

    addToast('Data mata uang berhasil diperbarui!', 'success');
  };

  const deleteCurrency = (id) => {
    const target = currencies.find((c) => c.id === id);
    if (target?.isBase || target?.code === 'IDR') {
      addToast('Mata uang basis (IDR) tidak dapat dihapus!', 'warning');
      return;
    }

    setCurrencies((prev) => prev.filter((c) => c.id !== id));

    fetch(`/api/master/currencies/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Error deleting currency:', err));

    addToast('Mata uang berhasil dihapus', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        // Operational Transactions
        preOrders,
        suratJalanList,
        bkkList,
        invoiceList,
        rekapanList,
        setRekapanList,
        fetchRekapan,
        fetchBkk,
        fetchInvoices,
        fetchMasterData,
        createPreOrder,
        approvePreOrder,
        rejectPreOrder,
        updatePreOrderCustomerPo,
        deletePreOrder,
        createSuratJalan,
        createBkk,
        approveBkk,
        rejectBkk,
        markBkkPaid,
        deleteBkk,
        fetchAvailableOrdersForBkk,
        fetchBkkPrintData,
        recordBkkPrint,
        uploadBkkDocument,
        submitBkkDocumentForVerification,
        approveBkkVerification,
        rejectBkkVerification,
        fetchBkkDocuments,
        fetchBkkAuditTrail,
        fetchAvailableOrdersForInvoice,
        createInvoice,
        approveInvoice,
        rejectInvoice,
        fetchInvoicePrintData,
        recordInvoicePrint,
        uploadInvoiceDocument,
        submitInvoiceDocumentForVerification,
        approveInvoiceVerification,
        rejectInvoiceVerification,
        fetchInvoiceDocuments,
        fetchInvoiceAuditTrail,
        markInvoicePaid,
        deleteInvoice,

        // Master Data States
        materials,
        suppliers,
        customers,
        armadaList,
        banks,
        bankAccounts,
        currencies,
        usersList,

        // Master Data Actions
        toggleMaterialStatus,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        toggleSupplierStatus,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        toggleCustomerStatus,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        toggleArmadaStatus,
        addArmada,
        updateArmada,
        deleteArmada,
        toggleBankStatus,
        addBank,
        updateBank,
        deleteBank,
        toggleBankAccountStatus,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        toggleCurrencyStatus,
        addCurrency,
        updateCurrency,
        deleteCurrency,

        // RO & PO Helper Utilities
        getCustomerPrefix: (c) => getCustomerPrefix(c, customers),
        generateNomorRO: (c, d) => generateNomorRO(c, [...preOrders, ...suratJalanList, ...rekapanList], d, customers),
        generatePoNumber: (c, d) => generatePoNumber(c, [...preOrders, ...suratJalanList, ...rekapanList, ...invoiceList], d, customers),
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

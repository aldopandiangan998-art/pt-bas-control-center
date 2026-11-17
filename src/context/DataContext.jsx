import { createContext, useContext, useState, useEffect } from 'react';
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
};

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
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
    kodeTransaksi: item.kodeTransaksi || '-',
    perusahaan: item.perusahaan || '-',
    material: item.material || '-',
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

  // Pre Order list per PT BAS Gresik
  const [preOrders, setPreOrders] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.preOrders, [
    {
      id: 'PO-DRAFT-01',
      nomorPo: 'PO-LW-2026-089', // Generated upon 1st SJ
      customer: 'PT LION WINGS',
      customerAddress: 'Kawasan Industri Gresik (KIG) Blok C-12, Manyar, Gresik',
      materialId: 'mat-8',
      materialName: 'SIRTU',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'm3',
      totalOrder: 500,
      terkirim: 161.43,
      hargaJual: 67233,
      hargaBeli: 50765,
      tanggal: '2026-11-01',
      top: '30 Hari',
      status: 'APPROVED', // 'DRAFT' | 'APPROVED' | 'SELESAI_KIRIM'
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-01 10:30',
      rejectionReason: null,
    },
    {
      id: 'PO-DRAFT-02',
      nomorPo: null, // Still waiting for 1st SJ
      customer: 'PT SEMEN INDONESIA',
      customerAddress: 'Jl. Veteran, Gresik',
      materialId: 'mat-4',
      materialName: 'LIMESTONE',
      materialCategory: 'Padat',
      pphRate: 2.65,
      satuan: 'm3',
      totalOrder: 1200,
      terkirim: 0,
      hargaJual: 42857,
      hargaBeli: 38991,
      tanggal: '2026-11-10',
      top: '14 Hari',
      status: 'APPROVED',
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-10 09:00',
      rejectionReason: null,
    },
    {
      id: 'PO-DRAFT-03',
      nomorPo: 'PO-PG-2026-041',
      customer: 'PT PETROKIMIA GRESIK',
      customerAddress: 'Jl. Jenderal Ahmad Yani, Gresik',
      materialId: 'mat-6',
      materialName: 'PASIR',
      materialCategory: 'Curah',
      pphRate: 2.0,
      satuan: 'rit',
      totalOrder: 150,
      terkirim: 45,
      hargaJual: 50000,
      hargaBeli: 40000,
      tanggal: '2026-11-04',
      top: 'Cash / Tunai',
      status: 'APPROVED',
      createdBy: 'Admin Gresik',
      approvedBy: 'David Rusiah (Direktur)',
      approvedAt: '2026-11-04 14:10',
      rejectionReason: null,
    },
    ]);
    return Array.isArray(raw)
      ? raw.map((po) => ({ ...po, status: po.status === 'MENUNGGU_APPROVAL' ? 'APPROVED' : po.status }))
      : [];
  });

  // Surat Jalan (Good Issue) list
  const [suratJalanList, setSuratJalanList] = useState(() => loadStorage(STORAGE_KEYS.suratJalan, [
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
      isPpn: false,
      panjangCm: 650,
      lebarCm: 250,
      tinggiCm: 200,
      koreksiCm: 0,
      volumeAkhir: 32.5,
      fotoSuratJalan: 'sj_29678_w9821ub.jpg',
      statusRekap: 'DIREKAP', // 'DRAFT' | 'DIREKAP' | 'DITAGIH'
    },
    {
      id: 'SJ-202611-0090',
      nomorSj: '29679',
      poNumber: 'PO-LW-2026-089',
      customer: 'PT LION WINGS',
      material: 'SIRTU',
      nopol: 'W 8812 UA',
      driver: 'Agus Triono',
      tanggal: '2026-11-07',
      waktu: '11:15',
      nomorNota: 'NT-88922',
      isPpn: false,
      panjangCm: 620,
      lebarCm: 240,
      tinggiCm: 190,
      koreksiCm: -5,
      volumeAkhir: 27.53,
      fotoSuratJalan: 'sj_29679_w8812ua.jpg',
      statusRekap: 'DIREKAP',
    },
  ]));

  // BKK (Cash Out) transactions strictly matching Screenshot 2 & Image 1
  const [bkkList, setBkkList] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.bkk, [
    {
      id: 'co-1',
      volume: 107.87,
      material: 'SIRTU',
      kodeTransaksi: '4500391980 - CO - BQWIJ',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'WINGS SURYA, PT',
      subDetail: 'ADITA JUSTIA SAPUTRA',
      timestamp: '2026-11-09 09:34:30',
      periode: 'Periode: 2026-09-28,2026-10-05',
      amount: 10894870.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'co-2',
      volume: 331.03,
      material: 'LIMESTONE',
      kodeTransaksi: 'POL-2607-000079 - CO - BFZQM',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'NUTRIPRO PRIMA ASIA, PT',
      subDetail: 'PAK TEGUH (BARU)',
      timestamp: '2026-11-04 11:50:16',
      periode: 'Periode: 2026-11-02,2026-11-03',
      amount: 22179010.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'co-3',
      volume: 155.94,
      material: 'SIRTU',
      kodeTransaksi: 'POS-2608-000224 - CO - 061TX',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'KARYA INDAH ALAM SEJAHTERA, PT',
      subDetail: 'ADITA JUSTIA SAPUTRA',
      timestamp: '2026-10-05 13:32:15',
      periode: 'Periode: 2026-09-29',
      amount: 18712800.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'co-4',
      volume: 158.55,
      material: 'SIRTU',
      kodeTransaksi: 'POS-2608-000224 - CO - HF7EW',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'KARYA INDAH ALAM SEJAHTERA, PT',
      subDetail: 'ADITA JUSTIA SAPUTRA',
      timestamp: '2026-10-02 13:56:35',
      periode: 'Periode: 2026-09-30,2026-10-01',
      amount: 19026000.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'co-5',
      volume: 249.84,
      material: 'SIRTU',
      kodeTransaksi: 'POS-2608-000224 - CO - SB9QN',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'KARYA INDAH ALAM SEJAHTERA, PT',
      subDetail: 'ADITA JUSTIA SAPUTRA',
      timestamp: '2026-09-22 14:40:15',
      periode: 'Periode: 2026-09-22',
      amount: 11232000.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-0',
      volume: 106.38,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-11 - RCP - UNG3H',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 4590011130',
      timestamp: '2026-11-12 09:10:40',
      periode: 'Periode: 2026-11-11',
      amount: 12765600.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-1',
      volume: 81.09,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-07 - RCP - RU4TN',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 4590011130',
      timestamp: '2026-11-09 09:43:20',
      periode: 'Periode: 2026-11-07',
      amount: 9730800.0,
      statusBayar: 'Belum Dibayar', // 'Belum Dibayar' (Hutang) | 'Lunas'
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-2',
      volume: 80.34,
      material: 'SIRTU',
      kodeTransaksi: '2026-11-05 - RCP - XAGXH',
      jenis: 'CURAH | JASA ANGKUT + MATERIAL',
      perusahaan: 'LION WINGS, PT',
      subDetail: 'LW 655 - CUR - 4590011130',
      timestamp: '2026-11-06 09:51:40',
      periode: 'Periode: 2026-11-05',
      amount: 9640800.0,
      statusBayar: 'Belum Dibayar',
      tanggalBayar: null,
      rekeningSumber: null,
    },
    {
      id: 'bkk-3',
      volume: 54.2,
      material: 'TANAH',
      kodeTransaksi: '2026-11-04 - RCP - PG99A',
      jenis: 'CURAH | JASA ANGKUT',
      perusahaan: 'PETROKIMIA GRESIK, PT',
      subDetail: 'PG 102 - TNH - 0021...',
      timestamp: '2026-11-06 14:12:00',
      periode: 'Periode: 2026-11-04',
      amount: 6500000.0,
      statusBayar: 'Lunas',
      tanggalBayar: '2026-11-08',
      rekeningSumber: 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
    },
    ]);
    return Array.isArray(raw) ? raw.map(normalizeBkkItem) : [];
  });

  // Data Invoices strictly matching Screenshot media_1794538112384_ea2f3289.jpg
  const [invoiceList, setInvoiceList] = useState(() => loadStorage(STORAGE_KEYS.invoices, [
    {
      id: 'inv-1',
      volume: 331.03,
      material: 'LIMESTONE',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-11-12 16:13',
      amount: 25500102.0,
      kodeTransaksi: 'POL-2607-000079 - INV - 4ENMI',
      perusahaan: 'NUTRIPRO PRIMA ASIA, PT',
      periode: 'Periode: [2026-11-02, 2026-11-03]',
      statusBayar: 'Belum Dibayar', // 'Belum Dibayar' (BELUM LUNAS) | 'Lunas'
    },
    {
      id: 'inv-2',
      volume: 1983.38,
      material: 'SIRTU',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-11-03 11:22',
      amount: 267682756.0,
      kodeTransaksi: 'POS-2608-000224 - INV - A3I1R',
      perusahaan: 'KARYA INDAH ALAM SEJAHTERA, PT',
      periode: 'Periode: [2026-10-22, 2026-10-23, 2026-10-26, 2026-10-...]',
      statusBayar: 'Belum Dibayar',
    },
    {
      id: 'inv-3',
      volume: 376.43,
      material: 'SIRTU',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-11-02 09:35',
      amount: 43477210.0,
      kodeTransaksi: '4510010537 - INV - L5CGP',
      perusahaan: 'WINGS SURYA, PT',
      periode: 'Periode: [2026-10-12, 2026-10-17, 2026-10-19, 2026-10-20]',
      statusBayar: 'Belum Dibayar',
    },
    {
      id: 'inv-4',
      volume: 107.87,
      material: 'SIRTU',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-11-02 09:27',
      amount: 12458854.0,
      kodeTransaksi: '4500391980 - INV - HMPPO',
      perusahaan: 'WINGS SURYA, PT',
      periode: 'Periode: [2026-09-28, 2026-10-05]',
      statusBayar: 'Belum Dibayar',
    },
    {
      id: 'inv-5',
      volume: 550.54,
      material: 'SIRTU',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-10-29 11:44',
      amount: 74302486.0,
      kodeTransaksi: '4590011130 - INV - C3DBN',
      perusahaan: 'LION WINGS, PT',
      periode: 'Periode: [2026-10-19, 2026-10-20, 2026-10-21, 2026-10-2...]',
      statusBayar: 'Belum Dibayar',
    },
    {
      id: 'inv-6',
      volume: 790.82,
      material: 'SIRTU',
      jenis: 'JASA ANGKUT + MATERIAL',
      timestamp: '2026-10-22 12:21',
      amount: 106731376.0,
      kodeTransaksi: '4590011130 - INV - 7X1KP',
      perusahaan: 'LION WINGS, PT',
      periode: 'Periode: [2026-10-12, 2026-10-14, 2026-10-15]',
      statusBayar: 'Belum Dibayar',
    },
  ]));

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
      pphRate: 2.0,
      satuan: 'rit',
      aktif: false,
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
      penerima: 'ADITA JUSTIA SAPUTRA',
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
      name: 'PT ADHI KARYA',
      jenisBadanUsaha: 'PT',
      alias: 'PT ADHI KARYA (PERSERO) TBK',
      alamat: 'Proyek Smelter Freeport Manyar, Gresik',
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
    { id: 'usr-2', name: 'Rudi Hartono', role: 'Admin', email: 'admin@ptbas.co.id', phone: '0813-8899-112', aktif: true },
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

  // Sync with backend SQLite database on mount
  const fetchPreOrders = async () => {
    try {
      const res = await fetch('/api/pre-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((po) => ({
            ...po,
            status: po.status === 'MENUNGGU_APPROVAL' ? 'APPROVED' : po.status,
          }));
          setPreOrders(normalized);
          try {
            localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(normalized));
          } catch (e) {}
        }
      }
    } catch (err) {
      // Offline fallback
    }
  };

  const fetchSuratJalan = async () => {
    try {
      const res = await fetch('/api/surat-jalan');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSuratJalanList(data);
          try {
            localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {}
  };

  const fetchBkk = async () => {
    try {
      const res = await fetch('/api/bkk');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeBkkItem);
          setBkkList(normalized);
          try {
            localStorage.setItem(STORAGE_KEYS.bkk, JSON.stringify(normalized));
          } catch (e) {}
        }
      }
    } catch (err) {}
  };

  // Sync master data and setup realtime cross-tab & cross-browser synchronization
  useEffect(() => {
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
        }
        if (supRes.status === 'fulfilled' && Array.isArray(supRes.value) && supRes.value.length > 0) {
          setSuppliers(supRes.value);
        }
        if (custRes.status === 'fulfilled' && Array.isArray(custRes.value) && custRes.value.length > 0) {
          setCustomers(custRes.value);
        }
        if (armRes.status === 'fulfilled' && Array.isArray(armRes.value) && armRes.value.length > 0) {
          setArmadaList(armRes.value);
        }
        if (bnkRes.status === 'fulfilled' && Array.isArray(bnkRes.value) && bnkRes.value.length > 0) {
          setBanks(bnkRes.value);
        }
        if (accRes.status === 'fulfilled' && Array.isArray(accRes.value) && accRes.value.length > 0) {
          setBankAccounts(accRes.value);
        }
        if (currRes.status === 'fulfilled' && Array.isArray(currRes.value) && currRes.value.length > 0) {
          setCurrencies(currRes.value);
        }
      } catch (err) {
        // Fall back to local storage cache smoothly
      }
    };

    fetchMasterData();
    fetchPreOrders();
    fetchSuratJalan();
    fetchBkk();

    // 1. BroadcastChannel for instant cross-tab sync in same browser
    let channel = null;
    try {
      channel = new BroadcastChannel('ptbas_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_PREORDERS' || event.data?.type === 'SYNC_ALL') {
          fetchPreOrders();
        }
        if (event.data?.type === 'SYNC_SURAT_JALAN' || event.data?.type === 'SYNC_ALL') {
          fetchSuratJalan();
        }
        if (event.data?.type === 'SYNC_BKK' || event.data?.type === 'SYNC_ALL') {
          fetchBkk();
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
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Polling & Window Focus sync (handles incognito & separate browser windows)
    const handleFocus = () => {
      fetchPreOrders();
      fetchSuratJalan();
      fetchBkk();
    };
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      fetchPreOrders();
      fetchSuratJalan();
    }, 2000); // 2-second background sync

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
    const timestamp = Date.now();
    const id = data.id || `PO-DRAFT-${timestamp}`;
    const newPo = {
      ...data,
      id,
      nomorPo: data.nomorPo || null, // Generated on 1st SJ
      terkirim: Number(data.terkirim) || 0,
      status: 'APPROVED',
      createdBy: data.createdBy || 'Admin Gresik',
      approvedBy: 'Auto-Approved',
      approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
      await fetch('/api/pre-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPo),
      });
    } catch (err) {
      console.warn('Backend PO sync failed, saved in localStorage:', err);
    }

    addToast('Pre Order berhasil diajukan! Menunggu persetujuan Super Admin.', 'success');
    return newPo;
  };

  const approvePreOrder = async (id, approverName = 'David Rusiah (Direktur)') => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Optimistic update
    setPreOrders((prev) => {
      const updated = prev.map((po) => {
        if (po.id === id) {
          return {
            ...po,
            status: 'APPROVED',
            approvedBy: approverName,
            approvedAt: now,
            rejectionReason: null,
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
      ch.postMessage({ type: 'SYNC_PREORDERS', action: 'approve', id });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      await fetch(`/api/pre-orders/${encodeURIComponent(id)}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver: approverName }),
      });
    } catch (err) {
      console.warn('Backend PO approve sync failed, saved in localStorage:', err);
    }

    addToast('Pre Order resmi DISETUJUI! Surat Jalan kini dapat dibuat.', 'success');
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
    } catch (err) {
      console.warn('Backend PO reject sync failed, saved in localStorage:', err);
    }

    addToast('Pre Order ditolak dan dikembalikan untuk revisi.', 'error');
  };

  // Surat Jalan Actions
  const createSuratJalan = async (sjData) => {
    // Strict enforcement: Validate PO approval status
    const targetPo = preOrders.find(
      (po) => (po.nomorPo && po.nomorPo === sjData.poNumber) || po.id === sjData.poNumber
    );

    if (targetPo && targetPo.status !== 'APPROVED') {
      addToast('Surat Jalan ditolak: Pre Order belum disetujui oleh Super Admin!', 'error');
      throw new Error('Pre Order belum disetujui');
    }

    const sjId = `SJ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(
      suratJalanList.length + 1
    ).padStart(4, '0')}`;

    const calc = calculateKubikasi(
      sjData.panjangCm,
      sjData.lebarCm,
      sjData.tinggiCm,
      sjData.koreksiTinggiCm || 0
    );

    const newSj = {
      ...sjData,
      id: sjId,
      volumeAkhir: calc.volumeAkhir,
      statusRekap: 'DRAFT',
    };

    setSuratJalanList((prev) => {
      const updated = [newSj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.suratJalan, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Update PO delivered volume & auto-assign PO number if first delivery
    setPreOrders((prev) => {
      const updated = prev.map((po) => {
        if (po.nomorPo === sjData.poNumber || po.id === sjData.poNumber || po.customer === sjData.customer) {
          const generatedPoNum =
            po.nomorPo ||
            `PO-${sjData.customer.replace(/[^A-Z]/g, '').slice(0, 2)}-2026-${Math.floor(
              100 + Math.random() * 900
            )}`;
          return {
            ...po,
            nomorPo: generatedPoNum,
            terkirim: Number((po.terkirim + calc.volumeAkhir).toFixed(2)),
          };
        }
        return po;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.preOrders, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Notify other tabs
    try {
      const ch = new BroadcastChannel('ptbas_sync_channel');
      ch.postMessage({ type: 'SYNC_SURAT_JALAN', action: 'create', id: sjId });
      ch.close();
    } catch (e) {}

    // Persist to backend SQLite
    try {
      await fetch('/api/surat-jalan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSj),
      });
    } catch (err) {
      console.warn('Backend Surat Jalan sync failed, saved in localStorage:', err);
    }

    addToast(`Surat Jalan No. ${sjData.nomorSj} berhasil disimpan! (${calc.volumeAkhir} m³)`, 'success');
    return newSj;
  };

  // BKK Cash Out Actions
  const markBkkPaid = (bkkIds, paymentDetails) => {
    setBkkList((prev) =>
      prev.map((item) => {
        if (bkkIds.includes(item.id)) {
          return {
            ...item,
            statusBayar: 'Lunas',
            tanggalBayar: paymentDetails?.tanggalBayar || new Date().toISOString().split('T')[0],
            rekeningSumber: paymentDetails?.rekeningSumber || 'BCA - 0188920199 a/n PT Berkah Alam Semesta',
          };
        }
        return item;
      })
    );
    try {
      fetch('/api/bkk/pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: bkkIds,
          tanggalBayar: paymentDetails?.tanggalBayar || new Date().toISOString().split('T')[0],
        }),
      }).catch(() => {});
    } catch (e) {}
    addToast(`${bkkIds.length} BKK berhasil dicatat LUNAS! Hutang supplier diperbarui.`, 'success');
  };

  // ------------------------------------------
  // INVOICE HELPERS
  // ------------------------------------------
  const createInvoice = (invData) => {
    const newInv = {
      id: `inv-${Date.now()}`,
      volume: invData.volume || 100,
      material: invData.material || 'SIRTU',
      jenis: invData.jenis || 'JASA ANGKUT + MATERIAL',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      amount: invData.totalTagihan || invData.amount || 0,
      kodeTransaksi: invData.nomorInvoice || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      perusahaan: invData.pelanggan || 'PT CUSTOMER',
      periode: invData.periode || `Periode: [${new Date().toISOString().split('T')[0]}]`,
      statusBayar: 'Belum Dibayar',
    };
    setInvoiceList((prev) => [newInv, ...prev]);
    addToast(`Invoice No. ${newInv.kodeTransaksi} berhasil dibuat!`, 'success');
    return newInv;
  };

  const markInvoicePaid = (invIds) => {
    setInvoiceList((prev) =>
      prev.map((item) =>
        invIds.includes(item.id) ? { ...item, statusBayar: 'Lunas' } : item
      )
    );
    addToast(`${invIds.length} Invoice berhasil dicatat LUNAS!`, 'success');
  };

  const deleteInvoice = (invId) => {
    setInvoiceList((prev) => prev.filter((item) => item.id !== invId));
    addToast('Invoice berhasil dihapus', 'info');
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

  const addSupplier = (newSup) => {
    const item = {
      ...newSup,
      id: newSup.id || `sup-${Date.now()}`,
      aktif: newSup.aktif !== undefined ? newSup.aktif : true,
    };
    setSuppliers((prev) => [...prev, item]);
    fetch('/api/master/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding supplier:', e));
    addToast(`Supplier "${item.name}" berhasil disimpan!`, 'success');
  };

  const deleteSupplier = (id) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/master/suppliers/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting supplier:', e)
    );
    addToast('Supplier berhasil dihapus', 'info');
  };

  const updateSupplier = (id, updatedData) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
            ...s,
            ...updatedData,
          }
          : s
      )
    );
    fetch(`/api/master/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating supplier:', e));
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

  const addCustomer = (newCust) => {
    const jbuPrefix = (newCust.jenisBadanUsaha || '').split('-')[0] || newCust.jenisBadanUsaha;
    const item = {
      ...newCust,
      id: newCust.id || `cust-${Date.now()}`,
      aktif: newCust.aktif !== undefined ? newCust.aktif : true,
      alias: newCust.alias || `${jbuPrefix} ${newCust.name}`.trim(),
    };
    setCustomers((prev) => [...prev, item]);
    fetch('/api/master/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((e) => console.error('Error adding customer:', e));
    addToast(`Customer "${item.name}" berhasil disimpan!`, 'success');
  };

  const updateCustomer = (id, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
            ...c,
            ...updatedData,
          }
          : c
      )
    );
    fetch(`/api/master/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((e) => console.error('Error updating customer:', e));
    addToast('Data customer berhasil diperbarui!', 'success');
  };

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/master/customers/${id}`, { method: 'DELETE' }).catch((e) =>
      console.error('Error deleting customer:', e)
    );
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
        createPreOrder,
        approvePreOrder,
        rejectPreOrder,
        createSuratJalan,
        markBkkPaid,
        createInvoice,
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

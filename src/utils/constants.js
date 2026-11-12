// Application-wide constants and design configurations for PT BAS Control Center

export const APP_CONFIG = {
  name: 'PT BAS Control Center',
  company: 'PT Berkah Alam Semesta',
  location: 'Gresik, Jawa Timur',
  version: '1.0.0-web',
};

// Initial user profile matching the screenshots
export const INITIAL_USER = {
  name: 'David Rusiah',
  email: 'ptbas.adm1@outlook.com',
  role: 'Super Admin', // Direktur
  branch: 'Gresik',
};

// Tax rates strictly per PT BAS Implementation Plan Section 2 (Aturan 29)
export const TAX_RATES = {
  PPN_PERCENT: 11,
  PPH_CURAH: 2.0, // Limestone Curah, Sirtu Curah, Paras Curah, Tanah Curah
  PPH_PADAT: 2.65, // Limestone Padat, Sirtu Padat Vibro, Sirtu Padat Doser, Cut & Fill
};

// Master material presets with their respective PPH rates
export const DEFAULT_MATERIALS = [
  { id: 'mat-1', name: 'Limestone Curah', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3' },
  { id: 'mat-2', name: 'Sirtu Curah', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3' },
  { id: 'mat-3', name: 'Paras Curah', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3' },
  { id: 'mat-4', name: 'Tanah Curah', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3' },
  { id: 'mat-5', name: 'Limestone Padat', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3' },
  { id: 'mat-6', name: 'Sirtu Padat Vibro', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3' },
  { id: 'mat-7', name: 'Sirtu Padat Doser', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3' },
  { id: 'mat-8', name: 'Cut & Fill', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3' },
];

// Navigation menu links mapping mobile labels to enterprise module routes
export const NAV_LINKS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    description: 'Pusat kontrol dan ringkasan operasional',
  },
  {
    path: '/pre-orders',
    label: 'Pre Order (RO)',
    icon: 'ClipboardList',
    description: 'Pemesanan awal material dari customer',
  },
  {
    path: '/surat-jalan',
    label: 'Surat Jalan (GI)',
    icon: 'Truck',
    description: 'Pencatatan kiriman harian & kalkulator kubikasi',
  },
  {
    path: '/rekapan',
    label: 'Rekapan (Jurnal GI)',
    icon: 'BookOpen',
    description: 'Rekap kiriman per PO, tanggal, dan PPN',
  },
  {
    path: '/bkk',
    label: 'BKK (Cash Out)',
    icon: 'Banknote',
    description: 'Bukti Kas Keluar ke supplier',
  },
  {
    path: '/invoices',
    label: 'Invoice',
    icon: 'Receipt',
    description: 'Tagihan penjualan ke customer',
  },
  {
    path: '/laporan',
    label: 'Laporan',
    icon: 'BarChart3',
    description: 'Rekapan belum invoice, piutang, dan hutang',
  },
  {
    path: '/master-data',
    label: 'Data Master',
    icon: 'Database',
    description: 'Pengguna, Material, Supplier, Customer, Armada, Bank',
  },
];


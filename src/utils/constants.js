// Application-wide constants and design configurations for PT BAS Control Center

export const APP_CONFIG = {
  name: 'PT BAS Control Center',
  company: 'PT Berkah Alam Semesta',
  location: 'Gresik, Jawa Timur',
  version: '1.1.12.rc220',
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
  { id: 'mat-1', name: 'BASE COURSE', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3', beli: 40000, jual: 50000 },
  { id: 'mat-2', name: 'BATU BOULDER', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3', beli: 32580, jual: 45800 },
  { id: 'mat-3', name: 'JASA ANGKUT', category: 'Jasa', pphRate: 2.0, defaultUnit: 'rit', beli: 20408, jual: 20408 },
  { id: 'mat-4', name: 'LIMESTONE', category: 'Padat', pphRate: 2.65, defaultUnit: 'm3', beli: 38991, jual: 42857 },
  { id: 'mat-5', name: 'PARAS', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3', beli: 41000, jual: 45000 },
  { id: 'mat-6', name: 'PASIR', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3', beli: 40000, jual: 50000 },
  { id: 'mat-7', name: 'PAVING STONE', category: 'Padat', pphRate: 2.65, defaultUnit: 'm2', beli: 71000, jual: 76000 },
  { id: 'mat-8', name: 'SIRTU', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3', beli: 50765, jual: 67233 },
  { id: 'mat-9', name: 'SIRTU AYAK', category: 'Curah', pphRate: 2.0, defaultUnit: 'm3', beli: 25000, jual: 37000 },
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
  {
    path: '/pengaturan',
    label: 'Pengaturan',
    icon: 'Settings',
    description: 'Konfigurasi akun, biometrik, tema, FAQ & legal',
  },
];

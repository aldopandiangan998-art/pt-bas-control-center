// Application-wide constants and design configurations for PT BAS Control Center

export const APP_CONFIG = {
  name: 'PT BAS Control Center',
  company: 'PT Berkah Alam Semesta',
  location: 'Gresik, Jawa Timur',
  version: '1.1.12.rc220',
};

/**
 * Otomatis menentukan role dan roleLabel berdasarkan email.
 * - superadmin@ptbas.co.id / email pimpinan / prefix superadmin -> Super Admin
 * - Email lainnya (termasuk dummy admin) -> Admin
 */
export function determineRoleByEmail(email) {
  if (!email) return { role: 'admin', roleLabel: 'Admin' };
  const cleanEmail = email.trim().toLowerCase();

  const superAdminList = [
    'superadmin@ptbas.co.id',
    'direksi@ptbas.co.id',
    'david.rusiah@ptbas.co.id',
  ];

  if (superAdminList.includes(cleanEmail) || cleanEmail.startsWith('superadmin')) {
    return {
      role: 'superadmin',
      roleLabel: 'Super Admin',
    };
  }

  return {
    role: 'admin',
    roleLabel: 'Admin',
  };
}

// Initial user profiles and mock database (strictly limited to Admin and Super Admin)
export const INITIAL_USERS_DB = [
  {
    id: 'usr-1',
    name: 'David Rusiah',
    email: 'superadmin@ptbas.co.id',
    password: 'superadmin123',
    role: 'superadmin',
    roleLabel: 'Super Admin',
    branch: 'Pusat & Hub Gresik',
    phone: '0811-3001-992',
    aktif: true,
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
    aktif: true,
  },
  {
    id: 'usr-3',
    name: 'Admin Dummy',
    email: 'admin.dummy@ptbas.co.id',
    password: 'admin123',
    role: 'admin',
    roleLabel: 'Admin',
    branch: 'Hub Gresik',
    phone: '0812-4567-8901',
    aktif: true,
  },
];

export const INITIAL_USER = INITIAL_USERS_DB[0];

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

// Categorized navigation menu links for structured enterprise sidebar
export const NAV_CATEGORIES = [
  {
    category: 'Utama',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        description: 'Pusat kontrol dan ringkasan operasional',
      },
    ],
  },
  {
    category: 'Logistik & Dispatch',
    items: [
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
    ],
  },
  {
    category: 'Keuangan & Faktur',
    items: [
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
        label: 'Pusat Laporan',
        icon: 'BarChart3',
        description: 'Rekapan belum invoice, piutang, dan hutang',
      },
    ],
  },
  {
    category: 'Sistem & Master',
    items: [
      {
        path: '/master-data',
        label: 'Data Master',
        icon: 'Database',
        description: 'Pengguna, Material, Supplier, Customer, Armada, Bank',
        children: [
          { path: '/master-data?tab=supplier', tab: 'supplier', label: 'Data Supplier', icon: 'HardHat' },
          { path: '/master-data?tab=material', tab: 'material', label: 'Data Material', icon: 'Mountain' },
          { path: '/master-data?tab=customer', tab: 'customer', label: 'Data Customer', icon: 'Building2' },
          { path: '/master-data?tab=armada', tab: 'armada', label: 'Data Armada', icon: 'Truck' },
          { path: '/master-data?tab=bank', tab: 'bank', label: 'Data Bank', icon: 'Landmark' },
          { path: '/master-data?tab=rekening', tab: 'rekening', label: 'Data Rekening Bank', icon: 'CreditCard' },
          { path: '/master-data?tab=pengguna', tab: 'pengguna', label: 'Data Pengguna', icon: 'Users' },
          { path: '/master-data?tab=mata-uang', tab: 'mata-uang', label: 'Data Mata Uang', icon: 'Coins' },
        ],
      },
      {
        path: '/pengaturan',
        label: 'Pengaturan',
        icon: 'Settings',
        description: 'Konfigurasi akun, biometrik, tema, FAQ & legal',
      },
    ],
  },
];

// Flat export for convenience and backward compatibility
export const NAV_LINKS = NAV_CATEGORIES.flatMap((c) => c.items);

import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

// ─── Translation dictionaries ────────────────────────────────────────────────
export const translations = {
  id: {
    // Navigation & Sidebar
    dashboard: 'Dashboard',
    receivedOrder: 'Received Order',
    suratJalan: 'Surat Jalan',
    bkk: 'BKK Cash Out',
    invoice: 'Invoice',
    laporan: 'Laporan',
    masterData: 'Master Data',
    approval: 'Persetujuan',
    settings: 'Pengaturan',
    profile: 'Profil Akun & Keamanan',
    logout: 'Keluar',

    // Settings page
    settingsTitle: 'Pengaturan Sistem',
    settingsDesc: 'Preferensi perangkat, autentikasi biometrik, bantuan lapangan, dan ketentuan legalitas',
    sectionGeneral: 'Umum',
    sectionHelp: 'Bantuan',
    sectionLegal: 'Legal',
    deviceType: 'Jenis Perangkat',
    quickLogin: 'Quick Login',
    quickLoginDesc: 'Login menggunakan biometrik',
    themeMode: 'Mode Tampilan (Tema)',
    themeDark: 'Mode Gelap (Dark Mode Aktif)',
    themeLight: 'Mode Terang (Light Mode Aktif)',
    language: 'Bahasa Aplikasi',
    languageDesc: 'Bahasa Indonesia (Aktif)',
    languageDescEn: 'English Language (Active)',
    langId: 'Indonesia',
    langEn: 'English',
    faq: 'FAQ',
    faqDesc: 'Frequently Asked Questions',
    reportIssue: 'Laporkan Masalah',
    reportIssueDesc: 'Bantuan teknis & kendala lapangan',
    termsOfUse: 'Ketentuan-Ketentuan Penggunaan',
    termsDesc: 'SOP Operasional Truk & Tagihan',
    privacyPolicy: 'Kebijakan Privasi',
    privacyDesc: 'Keamanan data transaksi & perbankan',
    appVersion: 'Versi Aplikasi',
    openSource: 'Open-Source Libraries',
    openSourceDesc: 'Lisensi dependensi yang digunakan',
  },
  en: {
    // Navigation & Sidebar
    dashboard: 'Dashboard',
    receivedOrder: 'Received Order',
    suratJalan: 'Delivery Order',
    bkk: 'BKK Cash Out',
    invoice: 'Invoice',
    laporan: 'Reports',
    masterData: 'Master Data',
    approval: 'Approval',
    settings: 'Settings',
    profile: 'Account Profile and Security',
    logout: 'Sign Out',

    // Settings page
    settingsTitle: 'System Settings',
    settingsDesc: 'Device preferences, biometric authentication, field support, and legal terms',
    sectionGeneral: 'General',
    sectionHelp: 'Help',
    sectionLegal: 'Legal',
    deviceType: 'Device Type',
    quickLogin: 'Quick Login',
    quickLoginDesc: 'Login using biometrics',
    themeMode: 'Display Mode (Theme)',
    themeDark: 'Dark Mode (Active)',
    themeLight: 'Light Mode (Active)',
    language: 'App Language',
    languageDesc: 'Bahasa Indonesia (Active)',
    languageDescEn: 'English Language (Active)',
    langId: 'Indonesia',
    langEn: 'English',
    faq: 'FAQ',
    faqDesc: 'Frequently Asked Questions',
    reportIssue: 'Report an Issue',
    reportIssueDesc: 'Technical support & field incidents',
    termsOfUse: 'Terms of Use',
    termsDesc: 'Truck & Invoice Operational SOP',
    privacyPolicy: 'Privacy Policy',
    privacyDesc: 'Transaction & banking data security',
    appVersion: 'App Version',
    openSource: 'Open-Source Libraries',
    openSourceDesc: 'Licenses of used dependencies',
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Theme state: 'dark' (default) | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('ptbas_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      // fallback
    }
    return 'dark'; // default industrial PT BAS
  });

  // Language state: 'id' (default) | 'en'
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('ptbas_language');
      if (saved === 'id' || saved === 'en') return saved;
    } catch (e) {
      // fallback
    }
    return 'id'; // default Bahasa Indonesia
  });

  useEffect(() => {
    try {
      localStorage.setItem('ptbas_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch (e) {
      console.warn('Failed to set theme:', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('ptbas_language', language);
      document.documentElement.setAttribute('lang', language);
    } catch (e) {
      console.warn('Failed to set language:', e);
    }
  }, [language]);

  const toggleMobileSidebar = () => setSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setSidebarOpen(false);
  const toggleCollapseSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const setLanguage = (lang) => {
    if (lang === 'id' || lang === 'en') setLanguageState(lang);
  };
  const toggleLanguage = () => setLanguageState((prev) => (prev === 'id' ? 'en' : 'id'));

  // Convenience: current translation dictionary
  const t = translations[language] || translations.id;

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        sidebarCollapsed,
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        toggleMobileSidebar,
        closeMobileSidebar,
        toggleCollapseSidebar,
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


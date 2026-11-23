import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  BookOpen,
  Banknote,
  Receipt,
  BarChart3,
  Database,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HardHat,
  Mountain,
  Building2,
  Landmark,
  CreditCard,
  Users,
  Coins,
  LogOut,
  User,
  KeyRound,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { NAV_CATEGORIES } from '../../utils/constants';
import logo from '../../assets/logo.png';

const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Truck,
  BookOpen,
  Banknote,
  Receipt,
  BarChart3,
  Database,
  Settings,
  HardHat,
  Mountain,
  Building2,
  Landmark,
  CreditCard,
  Users,
  Coins,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText,
  UserCheck,
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, closeMobileSidebar, sidebarCollapsed, toggleCollapseSidebar, isDark, language } = useApp();
  const { currentUser, isSuperAdmin, logout, users } = useAuth();
  const { preOrders, bkkList } = useData();
  const { addToast } = useToast();

  // Pending RO counter for notification badge
  const pendingRoCount = useMemo(() => {
    return preOrders ? preOrders.filter((po) => po.status === 'MENUNGGU_APPROVAL').length : 0;
  }, [preOrders]);

  // Pending BKK counter for notification badge
  const pendingBkkCount = useMemo(() => {
    if (!isSuperAdmin || !bkkList) return 0;
    return bkkList.filter((b) => b.status === 'MENUNGGU_APPROVAL').length;
  }, [bkkList, isSuperAdmin]);

  // Pending Admin Registration counter for Super Admin badge
  const pendingAdminCount = useMemo(() => {
    if (!isSuperAdmin || !users) return 0;
    return users.filter(
      (u) =>
        u.role !== 'superadmin' &&
        u.roleLabel !== 'Super Admin' &&
        u.id !== 'usr-1' &&
        (!u.aktif || u.aktif === 0)
    ).length;
  }, [users, isSuperAdmin]);

  // Profile dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const isProfileActive = location.pathname === '/profile' || location.pathname === '/profil';

  const handleLogout = () => {
    logout();
    addToast(language === 'en' ? 'Session ended. Please log in again.' : 'Sesi akun telah diakhiri. Silakan masuk kembali.', 'info');
    navigate('/login');
  };

  const navLabel = (label) => {
    if (language !== 'en') {
      // Bahasa Indonesia: ganti "Approval" menjadi "Persetujuan"
      if (label === 'Approval Registrasi Admin') return 'Persetujuan Registrasi Admin';
      if (label === 'Approval RO') return 'Persetujuan RO';
      return label.replace(/\bApproval\b/g, 'Persetujuan');
    }
    const map = {
      'Data Received Order': 'Received Order',
      'Surat Jalan (GI)': 'Delivery Order (GI)',
      'Rekapan (Jurnal GI)': 'GI Journal Recap',
      'BKK (Cash Out)': 'BKK (Cash Out)',
      'Laporan': 'Reports',
      'Data Master': 'Master Data',
      'Approval Registrasi Admin': 'Admin Registration Approval',
      'Persetujuan Registrasi Admin': 'Admin Registration Approval',
      'Pengaturan': 'Settings',
      'Approval RO': 'RO Approval',
      'Persetujuan RO': 'RO Approval',
      'Pajak Pertambahan Nilai (PPN)': 'Value Added Tax (VAT)',
      'Pajak Penghasilan Pasal 23 (PPh 23)': 'Income Tax Art. 23',
      'Laporan All in One': 'All-in-One Report',
      'Laporan Supplier': 'Supplier Report',
      'Data Supplier': 'Supplier Data',
      'Data Material': 'Material Data',
      'Data Customer': 'Customer Data',
      'Data Armada': 'Fleet Data',
      'Data Bank': 'Bank Data',
      'Data Rekening Bank': 'Bank Account Data',
      'Data Pengguna': 'User Data',
      'Data Mata Uang': 'Currency Data',
    };
    return map[label] || label;
  };

  const navCategory = (cat) => {
    if (language !== 'en') return cat;
    const map = {
      'Utama': 'Main',
      'Logistik & Dispatch': 'Logistics & Dispatch',
      'Keuangan & Faktur': 'Finance & Invoice',
      'Sistem & Master': 'System & Master',
    };
    return map[cat] || cat;
  };

  // Filter navigation items by role: Sembunyikan Pusat Laporan, Sistem & Master, dan modul SuperAdmin untuk role Admin
  const filteredNavCategories = useMemo(() => {
    return NAV_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!isSuperAdmin) {
          if (
            item.path === '/laporan' ||
            item.path === '/master-data' ||
            item.path === '/pengaturan' ||
            item.path === '/approval-ro' ||
            item.superAdminOnly
          ) {
            return false;
          }
        }
        return true;
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [isSuperAdmin]);

  // Track expanded state for expandable submenus
  const [openSubmenus, setOpenSubmenus] = useState(() => ({
    '/master-data': location.pathname === '/master-data',
    '/laporan': location.pathname.startsWith('/laporan'),
  }));

  // Automatically expand submenu if on /master-data or /laporan
  useEffect(() => {
    if (location.pathname === '/master-data') {
      setOpenSubmenus((prev) => ({ ...prev, '/master-data': true }));
    }
    if (location.pathname.startsWith('/laporan')) {
      setOpenSubmenus((prev) => ({ ...prev, '/laporan': true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (path) => {
    setOpenSubmenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const currentTab = new URLSearchParams(location.search).get('tab') || 'supplier';

  return (
    <>
      {/* Mobile Backdrop with Motion */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Industrial Sidebar Shell */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-200 select-none shrink-0 h-full max-h-full min-h-0 overflow-hidden ${
          isDark
            ? 'bg-[#0D0F11] border-r border-[#22262A]'
            : 'bg-white border-r border-slate-200 shadow-xs'
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-16' : 'w-64 lg:w-64'}`}
      >
        {/* Top Mini Section */}
        <div
          className={`shrink-0 flex items-center border-b transition-colors ${
            isDark ? 'border-[#22262A] bg-[#0E1012]' : 'border-slate-200 bg-slate-50'
          } ${
            sidebarCollapsed ? 'justify-center p-2.5 h-13' : 'justify-between px-3.5 h-13'
          }`}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={logo}
                  alt="PT BAS Logo"
                  className="w-7 h-7 object-contain rounded-md shrink-0 shadow-xs"
                />
                <span className={`text-xs font-semibold tracking-wider uppercase font-mono truncate ${
                  isDark ? 'text-neutral-200' : 'text-slate-800'
                }`}>
                  BAS CONTROL CENTER
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={closeMobileSidebar}
                  className={`lg:hidden p-1.5 rounded-md cursor-pointer transition-colors ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                  }`}
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleCollapseSidebar}
                  className={`hidden lg:flex p-1.5 rounded-md transition-colors cursor-pointer ${
                    isDark
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                  title="Persempit Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleCollapseSidebar}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#16181B] hover:bg-neutral-800 border-[#22262A] text-neutral-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Item List */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pt-3 pb-8 space-y-3.5 custom-scrollbar" aria-label="Menu Utama">
          {filteredNavCategories.map((cat, catIdx) => (
            <div key={cat.category} className="space-y-1">
              {/* Category Header (when expanded) or divider (when collapsed) */}
              {!sidebarCollapsed ? (
                <div className="px-2.5 py-1">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-neutral-400' : 'text-slate-500'
                  }`}>
                    {navCategory(cat.category)}
                  </span>
                </div>
              ) : (
                catIdx > 0 && <div className={`border-t my-2 mx-1 ${isDark ? 'border-[#22262A]' : 'border-slate-200'}`} />
              )}

              {/* Items in Category */}
              <div className="space-y-0.5">
                {cat.items.map((link) => {
                  const Icon = ICON_MAP[link.icon] || LayoutDashboard;
                  const hasChildren = Boolean(link.children && link.children.length > 0);
                  const isSubmenuOpen = Boolean(openSubmenus[link.path]);
                  const isParentActive =
                    location.pathname === link.path ||
                    (link.path === '/laporan' && location.pathname.startsWith('/laporan'));

                  // 1. Render item with submenu (e.g. Data Master)
                  if (hasChildren) {
                    return (
                      <div key={link.path} className="space-y-0.5">
                        <div
                          onClick={() => {
                            if (sidebarCollapsed) {
                              navigate(link.children?.[0]?.path || link.path);
                            } else {
                              toggleSubmenu(link.path);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && toggleSubmenu(link.path)}
                          className={`sidebar-submenu-trigger flex items-center rounded-md text-[13px] font-medium transition-all duration-150 group cursor-pointer ${
                            sidebarCollapsed
                              ? 'justify-center w-10 h-10 mx-auto'
                              : 'justify-between px-3 py-2.5'
                          } ${
                            isParentActive
                              ? isDark
                                ? 'sidebar-parent-active bg-[#1D2125] text-white font-semibold shadow-xs'
                                : 'sidebar-parent-active bg-orange-50 text-[#F4511E] font-semibold border-l-2 border-[#F4511E] shadow-2xs'
                              : isDark
                                ? 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181B1E]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          title={sidebarCollapsed ? `${navLabel(link.label)} (${link.children.length} sub-item)` : link.description}
                        >
                          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0 flex-1'}`}>
                            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                              isParentActive ? 'text-[#F4511E]' : isDark ? 'text-neutral-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                            }`} />
                            {!sidebarCollapsed && (
                              <span className="whitespace-nowrap leading-normal">{navLabel(link.label)}</span>
                            )}
                          </div>

                          {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isSubmenuOpen
                                    ? isDark ? 'rotate-180 text-white' : 'rotate-180 text-[#F4511E]'
                                    : isDark ? 'text-neutral-400' : 'text-slate-400'
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Submenu Children List */}
                        {!sidebarCollapsed && hasChildren && isSubmenuOpen && (
                          <div className={`sidebar-child-container ml-3.5 pl-2.5 border-l space-y-0.5 py-1 ${
                            isDark ? 'border-[#22262A]' : 'border-slate-200'
                          }`}>
                            {link.children.map((child) => {
                              const ChildIcon = ICON_MAP[child.icon] || Database;
                              const isChildActive =
                                location.pathname === child.path ||
                                (child.tab && isParentActive && currentTab === child.tab);

                              return (
                                <button
                                  key={child.path}
                                  type="button"
                                  onClick={() => {
                                    navigate(child.path);
                                    closeMobileSidebar();
                                  }}
                                  className={`sidebar-child-item w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all text-left group cursor-pointer ${
                                    isChildActive
                                      ? isDark
                                        ? 'active bg-[#F4511E]/20 text-[#FF7043] font-semibold border-l-2 border-[#F4511E]'
                                        : 'active bg-orange-50 text-[#F4511E] font-semibold border-l-2 border-[#F4511E]'
                                      : isDark
                                        ? 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1D2125]'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <ChildIcon
                                      className={`w-4 h-4 shrink-0 ${
                                        isChildActive
                                          ? 'text-[#FF7043]'
                                          : isDark
                                            ? 'text-neutral-500 group-hover:text-neutral-300'
                                            : 'text-slate-400 group-hover:text-slate-700'
                                      }`}
                                    />
                                    <span className="truncate">{navLabel(child.label)}</span>
                                  </div>
                                  {isChildActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4511E] shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 2. Normal Single NavLink
                  const isRoApproval = link.path === '/approval-ro';
                  const isAdminApproval = link.path === '/approval-admin';
                  const isBkkApproval = link.path === '/approval-bkk';
                  const badgeCount = isRoApproval
                    ? pendingRoCount
                    : (isAdminApproval ? pendingAdminCount : (isBkkApproval ? pendingBkkCount : 0));
                  const showBadge = badgeCount > 0;

                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex items-center rounded-md text-[13px] font-medium transition-all duration-150 group cursor-pointer ${
                          sidebarCollapsed
                            ? 'justify-center w-10 h-10 mx-auto relative'
                            : 'gap-3 px-3 py-2.5'
                        } ${
                          isActive
                            ? isDark
                              ? 'bg-[#F4511E]/15 text-[#FF7043] font-semibold border-l-2 border-[#F4511E] shadow-xs'
                              : 'bg-orange-50 text-[#F4511E] font-semibold border-l-2 border-[#F4511E] shadow-2xs'
                            : isDark
                              ? 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181B1E]'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                      title={sidebarCollapsed ? `${navCategory(cat.category)}: ${navLabel(link.label)}${showBadge ? ` (${badgeCount} pending)` : ''}` : link.description}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:scale-105" />
                        {sidebarCollapsed && showBadge && (
                          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#111315] animate-pulse" />
                        )}
                      </div>

                      {!sidebarCollapsed && (
                        <span className="whitespace-nowrap leading-normal flex-1">{navLabel(link.label)}</span>
                      )}

                      {!sidebarCollapsed && showBadge && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black shadow-xs shrink-0 ml-auto animate-pulse">
                          {badgeCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Consolidated User Profile & Control Toggles */}
        <div className={`shrink-0 border-t relative transition-colors ${
          isDark ? 'border-[#22262A] bg-[#0E1012]' : 'border-slate-200 bg-slate-50'
        }`}>
          {/* Backdrop for closing dropdown */}
          {profileDropdownOpen && (
            <div
              className={`fixed inset-0 z-40 transition-colors ${
                isDark ? 'bg-black/40 backdrop-blur-xs' : 'bg-slate-900/20 backdrop-blur-xs'
              }`}
              onClick={() => setProfileDropdownOpen(false)}
            />
          )}

          {/* Profile Dropdown Popup (Pojok Kiri Bawah) */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute bottom-full mb-2 z-50 rounded-2xl border shadow-2xl overflow-hidden font-sans select-none ${
                  sidebarCollapsed ? 'left-2 w-72' : 'left-2 right-2'
                } ${
                  isDark
                    ? 'bg-[#14171A] border-[#22262A] text-neutral-200 shadow-black/80'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                {/* Dropdown Header: User identity & info (Click to open full profile page) */}
                <div
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                    closeMobileSidebar();
                  }}
                  className={`p-3.5 border-b cursor-pointer transition-colors group ${
                    isDark
                      ? 'bg-gradient-to-r from-[#181B1E] to-[#14171A] border-[#22262A] hover:from-[#1D2125] hover:to-[#181B1E]'
                      : 'bg-gradient-to-r from-orange-50/80 to-slate-50 border-slate-200 hover:from-orange-100/90 hover:to-slate-100'
                  }`}
                  title="Klik untuk membuka Halaman Profil Akun"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F4511E] to-[#FF7043] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md overflow-hidden">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : currentUser?.name ? (
                        currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      ) : (
                        'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate flex items-center justify-between">
                        <span className={`transition-colors ${isDark ? 'text-white group-hover:text-amber-300' : 'text-slate-900 group-hover:text-[#F4511E]'}`}>
                          {currentUser?.name || 'Pengguna'}
                        </span>
                        <span
                          className={`text-[8px] font-bold font-mono px-1 py-0.2 rounded uppercase ${
                            isSuperAdmin
                              ? isDark
                                ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/30'
                                : 'bg-orange-100 text-[#F4511E] border border-orange-200'
                              : isDark
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate ${
                          isDark ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        {currentUser?.email || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Profile Key Info (Tanggal Lahir, Gender, No HP) */}
                  <div
                    className={`mt-2.5 pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${
                      isDark ? 'border-[#222A35] text-neutral-300' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className={`block text-[9px] uppercase ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        {language === 'en' ? 'Date of Birth' : 'Tanggal Lahir'}
                      </span>
                      <span className="font-semibold">{currentUser?.birth_date || '-'}</span>
                    </div>
                    <div>
                      <span className={`block text-[9px] uppercase ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        {language === 'en' ? 'Gender' : 'Gender'}
                      </span>
                      <span className="font-semibold">{currentUser?.gender || (language === 'en' ? 'Male' : 'Laki-laki')}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`block text-[9px] uppercase ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        {language === 'en' ? 'Phone / WA No.' : 'No. Telepon / WA'}
                      </span>
                      <span className="font-semibold">{currentUser?.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Action Menu */}
                <div className="p-1.5 space-y-0.5 text-xs">
                  {/* Buka Halaman Profil Akun */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                      closeMobileSidebar();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                      isDark
                        ? 'hover:bg-[#1D2125] text-neutral-200 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#F4511E] shrink-0" />
                    <div>
                      <div className="font-bold text-[11px]">
                        {language === 'en' ? 'Open Account Profile' : 'Buka Halaman Profil Akun'}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {language === 'en' ? 'Full name, DOB, gender, contact' : 'Nama lengkap, tgl lahir, gender, kontak'}
                      </div>
                    </div>
                  </button>

                  {/* Ubah Kata Sandi */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile?tab=password');
                      closeMobileSidebar();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                      isDark
                        ? 'hover:bg-[#1D2125] text-neutral-200 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-bold text-[11px]">
                        {language === 'en' ? 'Change Password & Security' : 'Ubah Sandi & Keamanan'}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        {language === 'en' ? 'New password & Option B verification' : 'Kata sandi baru & verifikasi Opsi B'}
                      </div>
                    </div>
                  </button>

                  <div className={`border-t my-1 ${isDark ? 'border-[#222A35]' : 'border-slate-200'}`} />

                  {/* Logout Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                      isDark
                        ? 'text-rose-300 hover:bg-rose-950/40 hover:text-rose-200'
                        : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-[11px]">
                      {language === 'en' ? 'Sign Out (Logout)' : 'Keluar dari Akun (Logout)'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!sidebarCollapsed ? (
            <div className="p-3 space-y-2">
              {/* User Profile Block Trigger */}
              <div
                className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all select-none ${
                  isProfileActive
                    ? isDark
                      ? 'bg-[#181B1E] border-[#F4511E] shadow-sm'
                      : 'bg-orange-50 border-[#F4511E] shadow-xs'
                    : profileDropdownOpen
                    ? isDark
                      ? 'bg-[#181B1E] border-[#F4511E]/50 shadow-md'
                      : 'bg-orange-50/70 border-[#F4511E]/40 shadow-xs'
                    : isDark
                      ? 'bg-[#14171A] border-[#22262A] hover:border-[#38404A]'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* User info area - clicks directly to /profile page */}
                <div
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/profile');
                    closeMobileSidebar();
                  }}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                  title={language === 'en' ? 'Click to open Account Profile Page' : 'Klik untuk membuka Halaman Profil Akun'}
                >
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs transition-colors overflow-hidden ${
                    isProfileActive
                      ? 'border-[#F4511E] bg-[#F4511E] text-white'
                      : isDark
                      ? 'border-[#333940] bg-[#16181B] text-neutral-200'
                      : 'border-slate-300 bg-slate-100 text-slate-700'
                  }`}>
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : currentUser?.name ? (
                      currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                    ) : (
                      'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold truncate leading-tight transition-colors ${
                      isProfileActive
                        ? 'text-[#F4511E] font-bold'
                        : isDark
                        ? 'text-white group-hover:text-amber-300'
                        : 'text-slate-900 group-hover:text-[#F4511E]'
                    }`}>
                      {currentUser?.name || (language === 'en' ? 'User' : 'Pengguna')}
                    </div>
                    <div className={`text-[10px] font-mono truncate leading-none mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}>
                      {currentUser?.email || '-'}
                    </div>
                  </div>
                </div>

                {/* Chevron trigger for dropdown menu */}
                <div
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer p-0.5 rounded hover:opacity-80"
                  title={profileDropdownOpen ? (language === 'en' ? 'Close Menu' : 'Tutup Menu') : (language === 'en' ? 'Open Account Options Menu' : 'Buka Menu Opsi Akun')}
                >
                  <span
                    className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isSuperAdmin
                        ? isDark
                          ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40'
                          : 'bg-orange-100 text-[#F4511E] border border-orange-200'
                        : isDark
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                  {profileDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#F4511E]" />
                  ) : (
                    <ChevronUp className={`w-3.5 h-3.5 transition-colors ${
                      isDark ? 'text-neutral-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                  )}
                </div>
              </div>

              {/* Quick Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-colors cursor-pointer border text-xs font-mono font-medium ${
                  isDark
                    ? 'bg-[#14171B] hover:bg-rose-950/60 text-rose-300 hover:text-white border-[#22262A]'
                    : 'bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-slate-200 shadow-2xs'
                }`}
                title={language === 'en' ? 'Sign Out from Account' : 'Keluar dari Akun (Logout)'}
                aria-label={language === 'en' ? 'Sign Out' : 'Keluar'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Sign Out' : 'Keluar Akun'}</span>
              </button>
            </div>
          ) : (
            /* Collapsed / Closed Sidebar State */
            <div className="py-2.5 px-1 flex flex-col items-center gap-1.5">
              <div
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/profile');
                  closeMobileSidebar();
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs cursor-pointer transition-all overflow-hidden ${
                  isProfileActive
                    ? 'border-[#F4511E] bg-[#F4511E] text-white scale-105'
                    : isDark
                    ? profileDropdownOpen
                      ? 'border-[#F4511E] bg-[#16181B] text-neutral-200 scale-105'
                      : 'border-[#333940] bg-[#16181B] text-neutral-200 hover:border-amber-400/60'
                    : profileDropdownOpen
                      ? 'border-[#F4511E] bg-slate-100 text-slate-800 scale-105'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-orange-400'
                }`}
                title={language === 'en' ? `Account Profile: ${currentUser?.name || 'User'} (Click to open profile)` : `Profil Akun: ${currentUser?.name || 'Pengguna'} (Klik untuk buka halaman profil)`}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : currentUser?.name ? (
                  currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                ) : (
                  'U'
                )}
              </div>

              <div className={`w-6 border-t my-0.5 ${isDark ? 'border-[#22262A]' : 'border-slate-200'}`} />

              <button
                type="button"
                onClick={handleLogout}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? 'hover:bg-rose-950/60 text-rose-400 hover:text-rose-200'
                    : 'hover:bg-rose-50 text-rose-600 hover:text-rose-700'
                }`}
                title={language === 'en' ? 'Sign Out' : 'Keluar (Logout)'}
                aria-label={language === 'en' ? 'Sign Out' : 'Keluar'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

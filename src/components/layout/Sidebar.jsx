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
  HardHat,
  Mountain,
  Building2,
  Landmark,
  CreditCard,
  Users,
  Coins,
  Sun,
  Moon,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NAV_CATEGORIES } from '../../utils/constants';

const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
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
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, closeMobileSidebar, sidebarCollapsed, toggleCollapseSidebar, isDark, toggleTheme } = useApp();
  const { currentUser, isSuperAdmin, logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast('Sesi akun telah diakhiri. Silakan masuk kembali.', 'info');
    navigate('/login');
  };

  const handleToggleTheme = () => {
    toggleTheme();
    addToast(
      `Tema diubah ke ${isDark ? 'Mode Terang (Light Mode)' : 'Mode Gelap (Dark Mode)'}`,
      'info'
    );
  };

  // Filter navigation items by role: Sembunyikan Pusat Laporan dan Sistem & Master untuk role Admin
  const filteredNavCategories = useMemo(() => {
    return NAV_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!isSuperAdmin) {
          if (item.path === '/laporan' || item.path === '/master-data' || item.path === '/pengaturan') {
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
  }));

  // Automatically expand submenu if on /master-data
  useEffect(() => {
    if (location.pathname === '/master-data') {
      setOpenSubmenus((prev) => ({ ...prev, '/master-data': true }));
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#111315] border-r border-[#22262A] transition-all duration-200 select-none shrink-0 h-full max-h-full min-h-0 overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-16' : 'w-64 lg:w-64'}`}
      >
        {/* Top Mini Section */}
        <div
          className={`shrink-0 flex items-center border-b border-[#22262A] bg-[#0E1012] ${
            sidebarCollapsed ? 'justify-center p-2.5 h-13' : 'justify-between px-3.5 h-13'
          }`}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-7 h-7 rounded-md bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
                  B
                </span>
                <span className="text-xs font-semibold text-neutral-200 tracking-wider uppercase font-mono truncate">
                  Modul Operasi
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={closeMobileSidebar}
                  className="lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-white cursor-pointer"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleCollapseSidebar}
                  className="hidden lg:flex p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
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
              className="w-8 h-8 rounded-lg bg-[#16181B] hover:bg-neutral-800 border border-[#22262A] flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Item List */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 space-y-3.5 custom-scrollbar" aria-label="Menu Utama">
          {filteredNavCategories.map((cat, catIdx) => (
            <div key={cat.category} className="space-y-1">
              {/* Category Header (when expanded) or divider (when collapsed) */}
              {!sidebarCollapsed ? (
                <div className="flex items-center justify-between px-2.5 py-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                    {cat.category}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-600 bg-[#16181B] px-1.5 py-0.2 rounded">
                    {cat.items.length}
                  </span>
                </div>
              ) : (
                catIdx > 0 && <div className="border-t border-[#22262A] my-2 mx-1" />
              )}

              {/* Items in Category */}
              <div className="space-y-0.5">
                {cat.items.map((link) => {
                  const Icon = ICON_MAP[link.icon] || LayoutDashboard;
                  const hasChildren = Boolean(link.children && link.children.length > 0);
                  const isSubmenuOpen = Boolean(openSubmenus[link.path]);
                  const isParentActive = location.pathname === link.path;

                  // 1. Render item with submenu (e.g. Data Master)
                  if (hasChildren) {
                    return (
                      <div key={link.path} className="space-y-0.5">
                        <div
                          onClick={() => {
                            if (sidebarCollapsed) {
                              navigate(link.path);
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
                              ? 'sidebar-parent-active bg-[#1D2125] text-white font-semibold shadow-xs'
                              : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181B1E]'
                            }`}
                          title={sidebarCollapsed ? `${link.label} (${link.children.length} sub-item)` : link.description}
                        >
                          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isParentActive ? 'text-[#F4511E]' : 'group-hover:scale-105'}`} />
                            {!sidebarCollapsed && (
                              <span className="truncate leading-none tracking-tight">{link.label}</span>
                            )}
                          </div>

                          {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className="sidebar-count-badge text-[10px] font-mono text-neutral-400 bg-[#151D28] px-1.5 py-0.2 rounded border border-[#1E2B3C]">
                                {link.children.length}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                                  isSubmenuOpen ? 'rotate-180 text-white' : ''
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Submenu Children List */}
                        {!sidebarCollapsed && hasChildren && isSubmenuOpen && (
                          <div className="sidebar-child-container ml-3.5 pl-2.5 border-l border-[#1E2B3C] space-y-0.5 py-1">
                            {link.children.map((child) => {
                              const ChildIcon = ICON_MAP[child.icon] || Database;
                              const isChildActive = isParentActive && currentTab === child.tab;

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
                                      ? 'active bg-[#F4511E]/20 text-[#FF7043] font-semibold border-l-2 border-[#F4511E]'
                                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#151D28]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <ChildIcon
                                      className={`w-4 h-4 shrink-0 ${
                                        isChildActive
                                          ? 'text-[#FF7043]'
                                          : 'text-neutral-500 group-hover:text-neutral-300'
                                      }`}
                                    />
                                    <span className="truncate">{child.label}</span>
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
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `flex items-center rounded-md text-[13px] font-medium transition-all duration-150 group cursor-pointer ${
                          sidebarCollapsed
                            ? 'justify-center w-10 h-10 mx-auto'
                            : 'gap-3 px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-[#151D28] text-[#FF7043] font-semibold border-l-2 border-[#F4511E] shadow-xs'
                            : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#151D28]'
                        }`
                      }
                      title={sidebarCollapsed ? `${cat.category}: ${link.label}` : link.description}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:scale-105" />
                      {!sidebarCollapsed && (
                        <span className="truncate leading-none tracking-tight">{link.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Consolidated User Profile & Control Toggles */}
        <div className="shrink-0 border-t border-[#22262A] bg-[#0E1012]">
          {!sidebarCollapsed ? (
            <div className="p-3 space-y-2.5">
              {/* User Profile Block */}
              <div
                onClick={() => isSuperAdmin && navigate('/pengaturan')}
                className={`flex items-center justify-between gap-2 ${isSuperAdmin ? 'cursor-pointer group' : 'cursor-default'
                  }`}
                title={isSuperAdmin ? 'Buka Pengaturan Akun' : `Profil: ${currentUser?.name || 'Admin'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full border border-[#333940] bg-[#16181B] flex items-center justify-center text-[10px] font-bold text-neutral-200 shrink-0">
                    {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                      {currentUser?.name || 'Pengguna'}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono truncate leading-none mt-0.5">
                      {currentUser?.email || '-'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${isSuperAdmin
                    ? 'bg-[#F4511E]/20 text-[#FF7043] border border-[#F4511E]/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                >
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>

              {/* Consolidated Functional Tool Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-[#22262A]">
                <div className="flex items-center gap-1">
                  {/* Theme Mode Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleTheme}
                    className="p-1.5 rounded bg-[#16181B] hover:bg-[#1D2125] text-neutral-300 hover:text-white transition-colors cursor-pointer border border-[#22262A]"
                    title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
                    aria-label="Ubah Tema Tampilan"
                  >
                    {isDark ? (
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </button>

                  {/* Riwayat Transaksi (Jurnal GI) */}
                  <button
                    type="button"
                    onClick={() => navigate('/rekapan')}
                    className="p-1.5 rounded bg-[#16181B] hover:bg-[#1D2125] text-neutral-300 hover:text-white transition-colors cursor-pointer border border-[#22262A]"
                    title="Riwayat Transaksi (Jurnal GI)"
                    aria-label="Riwayat Transaksi"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Pengaturan Sistem (Super Admin Only) */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => navigate('/pengaturan')}
                      className="p-1.5 rounded bg-[#16181B] hover:bg-[#1D2125] text-neutral-300 hover:text-white transition-colors cursor-pointer border border-[#22262A]"
                      title="Konfigurasi Sistem & Pengaturan"
                      aria-label="Pengaturan"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded bg-[#16181B] hover:bg-rose-900/60 text-rose-300 hover:text-white transition-colors cursor-pointer border border-[#22262A]"
                  title="Keluar dari Akun (Logout)"
                  aria-label="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed / Closed Sidebar State (w-16 = 64px, neat vertical alignment) */
            <div className="py-2.5 px-1 flex flex-col items-center gap-1.5">
              {/* Avatar with Role Tooltip */}
              <div
                onClick={() => isSuperAdmin && navigate('/pengaturan')}
                className={`w-8 h-8 rounded-full border border-[#333940] bg-[#16181B] flex items-center justify-center text-[11px] font-bold text-neutral-200 shrink-0 shadow-xs ${isSuperAdmin ? 'cursor-pointer hover:border-amber-400/60' : 'cursor-default'
                  }`}
                title={`${currentUser?.name || 'Pengguna'} (${isSuperAdmin ? 'Super Admin' : 'Admin'})`}
              >
                {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'U'}
              </div>

              <div className="w-6 border-t border-[#22262A] my-0.5" />

              {/* Vertical Stack of Toggles */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                aria-label="Ubah Tema"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-amber-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/rekapan')}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Riwayat Transaksi (Jurnal GI)"
                aria-label="Riwayat Transaksi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/pengaturan')}
                  className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Pengaturan Sistem"
                  aria-label="Pengaturan"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                title="Keluar (Logout)"
                aria-label="Keluar"
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

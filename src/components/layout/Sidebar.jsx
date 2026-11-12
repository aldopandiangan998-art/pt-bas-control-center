import { useState, useEffect } from 'react';
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
  UserCheck,
  HardHat,
  Mountain,
  Building2,
  Landmark,
  CreditCard,
  Users,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
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
  const { sidebarOpen, closeMobileSidebar, sidebarCollapsed, toggleCollapseSidebar } = useApp();
  const { currentUser, switchRole } = useAuth();

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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#111315] border-r border-[#22262A] transition-all duration-200 select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-16' : 'w-60 lg:w-60'}`}
      >
        {/* Top Mini Section */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#22262A] bg-[#0E1012]">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-6 h-6 rounded bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
              B
            </span>
            {!sidebarCollapsed && (
              <span className="text-xs font-bold text-neutral-300 tracking-wider uppercase font-mono">
                Modul Operasi
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1 text-neutral-400 hover:text-white cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleCollapseSidebar}
            className="hidden lg:flex p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Persempit Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Categorized Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3.5 scrollbar-thin" aria-label="Menu Utama">
          {NAV_CATEGORIES.map((cat, catIdx) => (
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
                          className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-all duration-150 group cursor-pointer ${
                            isParentActive
                              ? 'bg-[#1D2125] text-white font-semibold'
                              : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181B1E]'
                          }`}
                          title={sidebarCollapsed ? `${link.label} (${link.children.length} sub-item)` : link.description}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isParentActive ? 'text-[#F4511E]' : 'group-hover:scale-105'}`} />
                            {!sidebarCollapsed && (
                              <span className="truncate leading-none tracking-tight">{link.label}</span>
                            )}
                          </div>

                          {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className="text-[10px] font-mono text-neutral-500 bg-[#16181B] px-1.5 py-0.2 rounded">
                                {link.children.length}
                              </span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                                  isSubmenuOpen ? 'rotate-180 text-white' : ''
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Submenu Children List */}
                        {!sidebarCollapsed && hasChildren && isSubmenuOpen && (
                          <div className="ml-3.5 pl-2.5 border-l border-[#24282C] space-y-0.5 py-1">
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
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-all text-left group cursor-pointer ${
                                    isChildActive
                                      ? 'bg-[#F4511E]/15 text-[#F4511E] font-semibold border-l-2 border-[#F4511E]'
                                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#181B1E]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <ChildIcon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isChildActive
                                          ? 'text-[#F4511E]'
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
                        `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-all duration-150 group cursor-pointer ${
                          isActive
                            ? 'bg-[#1D2125] text-[#F4511E] font-semibold border-l-2 border-[#F4511E] shadow-xs'
                            : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#181B1E]'
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

        {/* Bottom Role Switcher Panel (Strictly Admin and Superadmin) */}
        <div className="p-2.5 border-t border-[#22262A] bg-[#0E1012]">
          {!sidebarCollapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                <UserCheck className="w-3 h-3 text-[#F4511E]" />
                <span>Simulasi Peran Aktif:</span>
              </div>
              <select
                value={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
                onChange={(e) => switchRole(e.target.value)}
                className="w-full text-[11px] bg-[#16181B] border border-[#2B3036] text-neutral-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#F4511E] font-medium cursor-pointer"
              >
                <option value="superadmin">Super Admin (Direktur)</option>
                <option value="admin">Admin (Operasional Gresik)</option>
              </select>
            </div>
          ) : (
            <div className="text-center py-1" title={`Role aktif: ${currentUser?.role}`}>
              <span className="text-[10px] font-bold text-[#F4511E] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-[#333]">
                {currentUser?.role === 'superadmin' ? 'SA' : 'AD'}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

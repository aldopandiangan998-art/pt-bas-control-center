import { NavLink } from 'react-router-dom';
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
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from '../../utils/constants';

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
};

export default function Sidebar() {
  const { sidebarOpen, closeMobileSidebar, sidebarCollapsed, toggleCollapseSidebar } = useApp();
  const { currentUser, switchRole } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Industrial Sidebar Shell */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#141414] border-r border-[#242424] transition-all duration-200 select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-16' : 'w-56 lg:w-56'}`}
      >
        {/* Top Mini Section */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[#222222]">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-6 h-6 rounded bg-[#F4511E] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              B
            </span>
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">
                Modul Operasi
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleCollapseSidebar}
            className="hidden lg:flex p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={sidebarCollapsed ? 'Perluas' : 'Persempit'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_LINKS.map((link) => {
            const Icon = ICON_MAP[link.icon] || LayoutDashboard;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors group ${
                    isActive
                      ? 'bg-[#222222] text-[#F4511E] font-semibold border-l-2 border-[#F4511E]'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-[#1A1A1A]'
                  }`
                }
                title={sidebarCollapsed ? link.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 transition-colors" />
                {!sidebarCollapsed && (
                  <span className="truncate leading-none tracking-tight">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Role Simulator Panel */}
        <div className="p-2.5 border-t border-[#222222] bg-[#111111]">
          {!sidebarCollapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                <UserCheck className="w-3 h-3 text-[#F4511E]" />
                <span>Simulasi Role:</span>
              </div>
              <select
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value)}
                className="w-full text-[11px] bg-[#181818] border border-[#2E2E2E] text-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-[#F4511E] font-medium"
              >
                <option value="Super Admin">Super Admin (Direktur)</option>
                <option value="Staff Pusat">Staff Pusat</option>
                <option value="Kadiv Pusat">Kadiv Pusat</option>
                <option value="Admin Gresik">Admin Gresik</option>
              </select>
            </div>
          ) : (
            <div className="text-center" title={`Role aktif: ${currentUser.role}`}>
              <span className="text-[10px] font-bold text-[#F4511E] font-mono">
                {currentUser.role[0]}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

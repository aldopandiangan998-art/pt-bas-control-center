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
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_LINKS } from '../../utils/constants';

// Mapping string icon keys to Lucide icon components
const ICON_MAP = {
  LayoutDashboard,
  ClipboardList,
  Truck,
  BookOpen,
  Banknote,
  Receipt,
  BarChart3,
  Database,
};

export default function Sidebar() {
  const { sidebarOpen, closeMobileSidebar, sidebarCollapsed, toggleCollapseSidebar } = useApp();
  const { currentUser, switchRole } = useAuth();

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1A1A1A] border-r border-[#2E2E2E] transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Sidebar Header (Mobile close + Desktop toggle) */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2E2E2E]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#F4511E] flex items-center justify-center font-bold text-white text-base shadow-md shrink-0">
              BAS
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-white text-sm truncate tracking-wide">
                Control Center
              </span>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapseSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {NAV_LINKS.map((link) => {
            const IconComponent = ICON_MAP[link.icon] || LayoutDashboard;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#F4511E] text-white shadow-md shadow-orange-950/40'
                      : 'text-neutral-400 hover:text-white hover:bg-[#252525]'
                  }`
                }
                title={sidebarCollapsed ? link.label : undefined}
              >
                <IconComponent className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!sidebarCollapsed && (
                  <span className="truncate leading-none">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom role indicator / tester */}
        <div className="p-3 border-t border-[#2E2E2E] bg-[#161616]">
          {!sidebarCollapsed ? (
            <div className="bg-[#242424] rounded-xl p-2.5 border border-[#333]">
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5">
                <Shield className="w-3.5 h-3.5 text-[#F4511E]" />
                <span className="font-semibold text-neutral-300">Role Simulasi:</span>
              </div>
              <select
                value={currentUser.role}
                onChange={(e) => switchRole(e.target.value)}
                className="w-full text-xs bg-[#1C1C1C] border border-[#3A3A3A] text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#F4511E]"
              >
                <option value="Super Admin">Super Admin (Direktur)</option>
                <option value="Staff Pusat">Staff Pusat</option>
                <option value="Kadiv Pusat">Kadiv Pusat</option>
                <option value="Admin Gresik">Admin Gresik</option>
              </select>
            </div>
          ) : (
            <div className="flex justify-center" title={`Role: ${currentUser.role}`}>
              <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#3A3A3A] flex items-center justify-center text-xs text-[#F4511E] font-bold">
                {currentUser.role[0]}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}


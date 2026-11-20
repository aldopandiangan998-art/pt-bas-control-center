import { Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { toggleMobileSidebar, isDark } = useApp();

  return (
    <header className={`border-b shadow-xs relative z-20 select-none shrink-0 transition-colors lg:hidden ${
      isDark
        ? 'timber-header text-white border-[#22262A]'
        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
    }`}>
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Left: Mobile trigger */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className={`p-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-[#F4511E] cursor-pointer ${
                isDark ? 'bg-black/25 hover:bg-black/40 text-neutral-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className={`font-bold text-xs uppercase font-mono ${
              isDark ? 'text-neutral-300' : 'text-slate-800'
            }`}>
              BAS Control Center
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}

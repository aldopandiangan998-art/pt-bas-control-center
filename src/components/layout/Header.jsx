import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_CONFIG } from '../../utils/constants';

export default function Header() {
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useApp();

  return (
    <header className="timber-header text-white shadow-md relative z-20 select-none shrink-0">
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Left: Mobile trigger & Corporate Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1.5 rounded bg-black/25 hover:bg-black/40 text-neutral-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
            >
              <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono group-hover:text-amber-200 transition-colors">
                {APP_CONFIG.name}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-black/35 text-amber-200/90 border border-black/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gresik Hub
              </span>
            </div>
          </div>

          {/* Right: Operational Status Indicator */}
          <div className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded border border-white/10 text-xs font-mono select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span className="text-neutral-300 hidden sm:inline">Sistem Operasional</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Online</span>
          </div>

        </div>
      </div>
    </header>
  );
}

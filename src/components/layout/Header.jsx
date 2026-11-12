import { useNavigate } from 'react-router-dom';
import { Menu, RotateCcw, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { APP_CONFIG } from '../../utils/constants';

export default function Header() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toggleMobileSidebar } = useApp();

  return (
    <header className="timber-header text-white shadow-md relative z-20 select-none">
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Mobile trigger & Corporate Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1.5 rounded bg-black/25 hover:bg-black/40 text-neutral-200 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="font-bold text-sm tracking-wider uppercase text-white font-mono">
                {APP_CONFIG.name}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-black/35 text-amber-200/90 border border-black/20">
                Gresik Hub
              </span>
            </div>
          </div>

          {/* Right: Account bar matching screenshot 4 + Functional shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Block from Screenshot 4 */}
            <div
              onClick={() => navigate('/pengaturan')}
              className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded border border-white/10 hover:bg-black/35 transition-colors cursor-pointer"
              title="Buka Pengaturan Akun"
            >
              <div className="w-6 h-6 rounded-full border border-white/40 bg-[#3A220F] flex items-center justify-center text-[10px] font-bold text-amber-300">
                {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('') : 'U'}
              </div>

              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-amber-200/70 font-mono leading-none">
                  {currentUser.email}
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#F4511E] text-white ml-1">
                {currentUser.role}
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-white/50 hidden sm:block" />
            </div>

            {/* Functional Tool Icons */}
            <div className="flex items-center gap-1 border-l border-white/15 pl-2">
              <button
                type="button"
                onClick={() => navigate('/rekapan')}
                className="p-1.5 rounded bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors"
                title="Riwayat Transaksi (Jurnal GI)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pengaturan')}
                className="p-1.5 rounded bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors"
                title="Konfigurasi Sistem & Pengaturan"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

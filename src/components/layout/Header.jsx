import { useNavigate } from 'react-router-dom';
import { Menu, RotateCcw, Settings, ChevronRight, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { APP_CONFIG } from '../../utils/constants';

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, roleLabel, logout } = useAuth();
  const { toggleMobileSidebar } = useApp();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    addToast('Sesi akun telah diakhiri. Silakan masuk kembali.', 'info');
    navigate('/login');
  };

  const displayRole = roleLabel || (currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin');

  return (
    <header className="timber-header text-white shadow-md relative z-20 select-none">
      <div className="w-full px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Mobile trigger & Corporate Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-1.5 rounded bg-black/25 hover:bg-black/40 text-neutral-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
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

          {/* Right: Account bar matching screenshot 4 + Functional shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Block from Screenshot 4 */}
            <div
              onClick={() => navigate('/pengaturan')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/pengaturan')}
              className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded border border-white/15 hover:bg-black/35 hover:border-amber-400/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Buka Pengaturan Akun"
            >
              <div className="w-6 h-6 rounded-full border border-sky-400/30 bg-[#162B45] flex items-center justify-center text-[10px] font-bold text-sky-300">
                {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('') : 'U'}
              </div>

              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser?.name || 'Pengguna'}
                </div>
                <div className="text-[10px] text-sky-200/70 font-mono leading-none">
                  {currentUser?.email || '-'}
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#0284C7] text-white ml-1 shadow-xs font-mono">
                {displayRole}
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-white/50 hidden sm:block" />
            </div>

            {/* Functional Tool Icons */}
            <div className="flex items-center gap-1 border-l border-white/15 pl-2">
              <button
                type="button"
                onClick={() => navigate('/rekapan')}
                className="p-1.5 rounded bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
                title="Riwayat Transaksi (Jurnal GI)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pengaturan')}
                className="p-1.5 rounded bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
                title="Konfigurasi Sistem & Pengaturan"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded bg-black/20 hover:bg-rose-900/60 text-rose-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer ml-0.5"
                title="Keluar dari Akun (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

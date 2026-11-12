import { Menu, RotateCcw, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { APP_CONFIG } from '../../utils/constants';

export default function Header() {
  const { currentUser } = useAuth();
  const { toggleMobileSidebar } = useApp();

  return (
    <header className="bg-wood-grain text-white shadow-lg border-b border-[#3A2412] relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left section: Mobile menu trigger + Brand title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg bg-black/20 hover:bg-black/30 text-white focus:outline-none transition-colors"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4511E] inline-block shadow-sm animate-pulse"></span>
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-amber-100/80 hidden sm:block">
                {APP_CONFIG.company} • {APP_CONFIG.location}
              </p>
            </div>
          </div>

          {/* Center/Right section: User profile banner matching Screenshot 4 */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-9 h-9 rounded-full border-2 border-white/80 bg-neutral-800 flex items-center justify-center text-amber-300 font-bold text-sm shadow-inner">
                {currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('') : <User className="w-4 h-4" />}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-white leading-tight">
                  Hi, {currentUser.name}!
                </div>
                <div className="text-[11px] text-amber-200/90 leading-none">
                  {currentUser.email}
                </div>
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-[#F4511E] text-white rounded">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Action icons from screenshots: History & Settings */}
            <div className="flex items-center gap-1.5 text-white/90">
              <button
                type="button"
                className="p-2 rounded-lg bg-black/20 hover:bg-black/30 hover:text-white transition-colors"
                title="Riwayat Transaksi"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg bg-black/20 hover:bg-black/30 hover:text-white transition-colors"
                title="Pengaturan Sistem"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

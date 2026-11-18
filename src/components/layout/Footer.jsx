import { APP_CONFIG } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isDark } = useApp();
  const { currentUser } = useAuth();

  // Sembunyikan footer untuk role admin dan superadmin
  const role = currentUser?.role?.toLowerCase();
  if (role === 'admin' || role === 'superadmin') return null;

  return (
    <footer className={`mt-8 pt-3 border-t text-[11px] font-mono flex flex-col sm:flex-row items-center justify-between gap-1 select-none transition-colors ${
      isDark ? 'border-[#22262A] text-neutral-500' : 'border-slate-200 text-slate-500'
    }`}>
      <div>
        <strong className={`font-sans font-medium ${isDark ? 'text-neutral-400' : 'text-slate-700'}`}>
          {APP_CONFIG.name}
        </strong>{' '}
        • {APP_CONFIG.company} ({APP_CONFIG.location})
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Gresik Dispatch Console • Build {APP_CONFIG.version} &copy; {currentYear}</span>
      </div>
    </footer>
  );
}

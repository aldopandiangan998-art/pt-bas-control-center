import { APP_CONFIG } from '../../utils/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 pt-3 border-t border-[#22262A] text-[11px] text-neutral-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-1 select-none">
      <div>
        <strong className="text-neutral-400 font-sans font-medium">{APP_CONFIG.name}</strong> • {APP_CONFIG.company} ({APP_CONFIG.location})
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Gresik Dispatch Console • Build {APP_CONFIG.version} &copy; {currentYear}</span>
      </div>
    </footer>
  );
}

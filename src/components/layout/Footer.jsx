import { APP_CONFIG } from '../../utils/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 pt-3 border-t border-[#1F1F1F] text-[11px] text-neutral-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-1 select-none">
      <div>
        <strong className="text-neutral-400 font-sans font-medium">{APP_CONFIG.name}</strong> • {APP_CONFIG.company}
      </div>
      <div>
        Hub Gresik • Sistem Operasional Rantai Pasok v1.0
      </div>
    </footer>
  );
}

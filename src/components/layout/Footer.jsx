import { APP_CONFIG } from '../../utils/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#181818] border-t border-[#2A2A2A] text-neutral-400 text-xs py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p>
          &copy; {currentYear} <span className="text-white font-medium">{APP_CONFIG.name}</span> • {APP_CONFIG.company}
        </p>
        <p className="text-neutral-500">
          Operasional Cabang {APP_CONFIG.location} • Versi {APP_CONFIG.version}
        </p>
      </div>
    </footer>
  );
}


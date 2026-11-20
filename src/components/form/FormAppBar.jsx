import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * FormAppBar – sticky top bar for the form with back button and title.
 * Triggers the same cancel action as the existing "Batal" button.
 */
export default function FormAppBar({ title = 'Buat Received Order (RO)', onBack }) {
  const { isDark } = useApp();

  return (
    <div
      className={`flex items-center gap-3 h-14 px-2 mb-4 transition-colors ${
        isDark
          ? 'bg-[#111315] border-b border-[#22262A]'
          : 'bg-white border-b border-slate-200 shadow-xs'
      }`}
    >
      <button
        type="button"
        onClick={onBack}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] cursor-pointer ${
          isDark
            ? 'text-neutral-300 hover:bg-[#1C2029] hover:text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
        aria-label="Kembali"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2
        className={`flex-1 text-sm font-semibold tracking-tight truncate ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

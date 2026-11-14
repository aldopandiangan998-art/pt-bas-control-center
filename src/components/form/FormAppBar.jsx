import { ArrowLeft } from 'lucide-react';

/**
 * FormAppBar – sticky top bar for the form with back button and title.
 * Triggers the same cancel action as the existing "Batal" button.
 */
export default function FormAppBar({ title = 'Buat Received Order (RO)', onBack }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 h-14 bg-[#0B111E] border-b border-[#1A1E24] px-2 mb-4">
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-300 hover:bg-[#1C2029] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E]"
        aria-label="Kembali"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="flex-1 text-sm font-semibold text-white tracking-tight truncate">
        {title}
      </h2>
    </div>
  );
}

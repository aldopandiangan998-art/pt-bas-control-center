import { Check } from 'lucide-react';

/**
 * FabSubmit – floating action button (orange circle with checkmark) for form submission.
 * Position: sticky bottom-right inside the form container.
 * States: normal, loading (spinner), disabled.
 */
export default function FabSubmit({ loading = false, disabled = false, onClick, type = 'submit' }) {
  return (
    <div className="sticky bottom-6 flex justify-end pr-2 mt-4 pointer-events-none">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label="Simpan & Ajukan RO"
        title="Simpan & Ajukan RO"
        className={`
          pointer-events-auto
          w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-lg shadow-[#F4511E]/30
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F4511E]
          active:scale-95
          ${disabled || loading
            ? 'bg-[#F4511E]/50 cursor-not-allowed'
            : 'bg-[#F4511E] hover:bg-[#E04418] cursor-pointer'
          }
        `}
      >
        {loading ? (
          <svg
            className="w-6 h-6 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

import { FileSearch, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ReportEmptyState({
  title = 'Tidak ada data untuk filter yang dipilih',
  message = 'Silakan sesuaikan kembali rentang tanggal atau kriteria filter yang Anda gunakan.',
  onReset,
}) {
  const { isDark } = useApp();

  return (
    <div className={`p-10 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3 ${
      isDark ? 'bg-[#14171A]/50 border-[#22262A] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-500'
    }`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-200/80 text-slate-600'
      }`}>
        <FileSearch className="w-6 h-6" />
      </div>
      <div>
        <h4 className={`text-sm font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
          {title}
        </h4>
        <p className="text-xs mt-1 max-w-sm mx-auto">
          {message}
        </p>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className={`mt-2 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark
              ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300'
              : 'border-slate-300 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Printer,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Reusable ReportFilterCard
 * Houses filter inputs, validation state, Apply button, and optional Reset / Print / Export buttons.
 */
export default function ReportFilterCard({
  title = 'Filter Parameter Laporan',
  children,
  onApply,
  onReset,
  onPrint,
  onExportCsv,
  loading = false,
  applyDisabled = false,
  applyLabel = 'Terapkan Filter',
  canReset = true,
  className = '',
  onToggleCollapse,
}) {
  const { isDark } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggleCollapse?.(!next);
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isDark
          ? 'bg-[#14171A] border-[#22262A] shadow-lg shadow-black/40'
          : 'bg-white border-slate-200 shadow-sm'
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isDark
            ? 'border-[#22262A] bg-[#181B1E]'
            : 'border-slate-100 bg-slate-50/70'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {/* Icon badge */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isDark
                ? 'bg-[#F4511E]/15 text-[#F4511E]'
                : 'bg-orange-50 text-[#F4511E] border border-orange-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-xs font-bold font-mono tracking-wide uppercase ${
              isDark ? 'text-neutral-200' : 'text-slate-700'
            }`}
          >
            {title}
          </span>
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
              }`}
              title="Ekspor CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-neutral-300 bg-neutral-800/60 hover:bg-neutral-700 hover:text-white'
                  : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-800'
              }`}
              title="Cetak Halaman Laporan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800 hover:border-neutral-700'
                : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={collapsed ? 'Tampilkan Filter' : 'Sembunyikan Filter'}
            aria-label="Toggle Filter Visibility"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Body */}
      {!collapsed && (
        <>
          <div className="p-4 space-y-4">
            {children}
          </div>

          {/* Action Footer — visually separated */}
          <div
            className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t ${
              isDark
                ? 'border-[#22262A] bg-[#0F1114]'
                : 'border-slate-100 bg-slate-50/80'
            }`}
          >
            {/* Left side: Reset */}
            <div className="flex items-center gap-2">
              {canReset && onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'border-[#2E3339] text-neutral-400 hover:text-neutral-100 hover:bg-[#1E2226] hover:border-[#3A4049]'
                      : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-white hover:border-slate-400'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right side: Apply CTA */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onApply}
                disabled={applyDisabled || loading}
                className={`
                  relative inline-flex items-center gap-2 px-5 py-2.5
                  rounded-xl text-xs font-bold uppercase tracking-wider
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] focus-visible:ring-offset-1
                  ${isDark ? 'focus-visible:ring-offset-[#0F1114]' : 'focus-visible:ring-offset-slate-50'}
                  ${
                    applyDisabled || loading
                      ? isDark
                        ? 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        : 'bg-slate-200 text-slate-400 border border-slate-300'
                      : 'bg-[#F4511E] hover:bg-[#D84315] active:bg-[#BF360C] text-white border border-[#F4511E]/0 shadow-md shadow-[#F4511E]/25 hover:shadow-lg hover:shadow-[#F4511E]/30 active:scale-[0.98]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>{applyLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

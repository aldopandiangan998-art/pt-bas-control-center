import { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Loader2, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui';
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
}) {
  const { isDark } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#14171A] border-[#22262A] shadow-lg shadow-black/40'
          : 'bg-white border-slate-200 shadow-sm'
      } ${className}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDark ? 'border-[#22262A] bg-[#181B1E]' : 'border-slate-100 bg-slate-50/70'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F4511E]/15 text-[#F4511E] flex items-center justify-center">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-bold font-mono tracking-wide uppercase ${
            isDark ? 'text-neutral-200' : 'text-slate-800'
          }`}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
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
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-neutral-300 bg-neutral-800 hover:bg-neutral-700'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
              }`}
              title="Cetak Halaman Laporan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={collapsed ? 'Tampilkan Filter' : 'Sembunyikan Filter'}
            aria-label="Toggle Filter Visibility"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Body */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>{children}</div>

          {/* Action Footer */}
          <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2.5 ${
            isDark ? 'border-[#22262A]' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              {canReset && onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'border-[#2E3339] text-neutral-400 hover:text-neutral-100 hover:bg-[#1E2226]'
                      : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="primary"
                onClick={onApply}
                disabled={applyDisabled || loading}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Filter className="w-3.5 h-3.5" />
                    <span>{applyLabel}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

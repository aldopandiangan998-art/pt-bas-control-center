import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, Banknote, ChevronRight, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function JenisLaporanPajakModal({ isOpen, onClose, onSelect }) {
  const { isDark } = useApp();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop matching native screenshot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer select-none"
            aria-hidden="true"
          />

          {/* Modal Card matching screenshot aesthetics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden font-sans border select-none transition-colors ${
              isDark
                ? 'bg-[#2B3037] border-[#3B424D] text-neutral-100 shadow-black/80'
                : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-pajak-title"
          >
            {/* Header: Title matching image */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <h3
                id="modal-pajak-title"
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Jenis Laporan Pajak
              </h3>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of 2 Tax Report Options matching screenshot */}
            <div className="px-5 pb-5 pt-1 space-y-2.5">
              {/* Option 1: Pajak Pertambahan Nilai (PPN) */}
              <button
                type="button"
                onClick={() => onSelect('ppn')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group text-left ${
                  isDark
                    ? 'bg-[#20242B] border-[#373F4B] hover:border-[#F4511E] hover:bg-[#262C34]'
                    : 'bg-slate-50 border-slate-200 hover:border-[#F4511E] hover:bg-orange-50/70 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-sm transition-colors ${
                        isDark ? 'text-white group-hover:text-[#FF7043]' : 'text-slate-900 group-hover:text-[#F4511E]'
                      }`}
                    >
                      Pajak Pertambahan Nilai (PPN)
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-neutral-300' : 'text-slate-500'}`}>
                      Faktur pajak keluaran PPN 11% penjualan material customer
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      isDark
                        ? 'bg-orange-500/15 text-[#FF7043] border-orange-500/30'
                        : 'bg-orange-100 text-[#F4511E] border-orange-200'
                    }`}
                  >
                    11%
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isDark ? 'text-neutral-400 group-hover:text-[#FF7043]' : 'text-slate-400 group-hover:text-[#F4511E]'
                    }`}
                  />
                </div>
              </button>

              {/* Option 2: Pajak Penghasilan Pasal 23 (PPh 23) */}
              <button
                type="button"
                onClick={() => onSelect('pph23')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group text-left ${
                  isDark
                    ? 'bg-[#20242B] border-[#373F4B] hover:border-emerald-500 hover:bg-[#262C34]'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/70 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-sm transition-colors ${
                        isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'
                      }`}
                    >
                      Pajak Penghasilan Pasal 23 (PPh 23)
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-neutral-300' : 'text-slate-500'}`}>
                      Potongan PPh 23 (2.0% - 2.65%) kas keluar BKK vendor
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      isDark
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    2.0% / 2.65%
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isDark ? 'text-neutral-400 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-700'
                    }`}
                  />
                </div>
              </button>

              {/* Option 3: Laporan All-In-One */}
              <button
                type="button"
                onClick={() => onSelect('all-in-one')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group text-left ${
                  isDark
                    ? 'bg-[#20242B] border-[#373F4B] hover:border-[#F4511E] hover:bg-[#262C34]'
                    : 'bg-slate-50 border-slate-200 hover:border-[#F4511E] hover:bg-orange-50/70 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-[#F4511E] flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-sm transition-colors ${
                        isDark ? 'text-white group-hover:text-[#FF7043]' : 'text-slate-900 group-hover:text-[#F4511E]'
                      }`}
                    >
                      Laporan All-In-One
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-neutral-300' : 'text-slate-500'}`}>
                      Kompilasi lengkap transaksi Surat Jalan, Rekapan, dan Tagihan per Pelanggan
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-2 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                      isDark
                        ? 'bg-orange-500/15 text-[#FF7043] border-orange-500/30'
                        : 'bg-orange-100 text-[#F4511E] border-orange-200'
                    }`}
                  >
                    ALL
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isDark ? 'text-neutral-400 group-hover:text-[#FF7043]' : 'text-slate-400 group-hover:text-[#F4511E]'
                    }`}
                  />
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

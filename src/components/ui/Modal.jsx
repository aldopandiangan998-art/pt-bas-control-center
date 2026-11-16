import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
}) {
  const { isDark } = useApp();

  // Listen for Escape key
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className={clsx(
              'fixed inset-0 backdrop-blur-xs transition-colors',
              isDark ? 'bg-black/80' : 'bg-slate-900/40'
            )}
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={clsx(
              'relative w-full rounded-xl overflow-hidden shadow-2xl z-10 my-auto transition-colors modal-box',
              isDark
                ? 'bg-[#131517] border border-[#2D3339] text-white'
                : 'bg-white border border-slate-200 text-slate-900 shadow-2xl',
              maxWidth
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(title || showClose) && (
              <div
                className={clsx(
                  'flex items-center justify-between px-4 py-3 border-b transition-colors',
                  isDark
                    ? 'bg-[#181B1E] border-[#24282C]'
                    : 'bg-slate-50 border-slate-200'
                )}
              >
                <div>
                  {title && (
                    <h3
                      className={clsx(
                        'text-sm font-bold tracking-wide',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p
                      className={clsx(
                        'text-[11px] mt-0.5',
                        isDark ? 'text-neutral-400' : 'text-slate-500'
                      )}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={clsx(
                      'p-1 rounded transition-colors cursor-pointer',
                      isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-[#22272C]'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                    )}
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className={clsx(
                'max-h-[80vh] overflow-y-auto',
                isDark ? 'text-neutral-200' : 'text-slate-800'
              )}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

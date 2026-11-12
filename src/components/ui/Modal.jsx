import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
}) {
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
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={clsx(
              'relative w-full bg-[#131517] border border-[#2D3339] rounded-xl overflow-hidden shadow-2xl z-10 my-auto',
              maxWidth
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-4 py-3 bg-[#181B1E] border-b border-[#24282C]">
                <div>
                  {title && <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>}
                  {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>}
                </div>

                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#22272C] transition-colors cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


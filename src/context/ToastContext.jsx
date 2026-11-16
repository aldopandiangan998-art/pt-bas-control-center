import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from './AppContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  // Dynamic theme detection
  let isDark = true;
  try {
    const app = useApp();
    if (app && typeof app.isDark === 'boolean') {
      isDark = app.isDark;
    }
  } catch (e) {
    // fallback
  }

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              role="status"
              className={`toast-notification pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 animate-in fade-in slide-in-from-top-2 select-none ${
                isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-info'
              } ${
                isDark
                  ? isSuccess
                    ? 'bg-[#122119]/95 border-emerald-500/50 text-emerald-300 shadow-xl shadow-black/40'
                    : isError
                    ? 'bg-[#271418]/95 border-rose-500/50 text-rose-300 shadow-xl shadow-black/40'
                    : 'bg-[#131E2E]/95 border-sky-500/50 text-sky-300 shadow-xl shadow-black/40'
                  : isSuccess
                  ? 'bg-white border-emerald-400 text-emerald-950 shadow-xl shadow-emerald-950/10'
                  : isError
                  ? 'bg-white border-rose-400 text-rose-950 shadow-xl shadow-rose-950/10'
                  : 'bg-white border-sky-400 text-sky-950 shadow-xl shadow-sky-950/10'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : isError ? (
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              ) : (
                <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              )}
              <div
                className={`toast-message text-xs font-semibold leading-relaxed flex-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`toast-close p-0.5 transition-colors cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}


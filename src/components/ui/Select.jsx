import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    icon: Icon,
    required = false,
    className = '',
    children,
    id,
    ...props
  },
  ref
) {
  const { isDark } = useApp();
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={clsx(
            'block text-[11px] font-medium transition-colors',
            isDark ? 'text-neutral-300' : 'text-slate-700'
          )}
        >
          {label} {required && <span className="text-[#F4511E] font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div
            className={clsx(
              'absolute left-3 pointer-events-none flex items-center justify-center transition-colors',
              isDark ? 'text-neutral-500' : 'text-slate-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          required={required}
          className={clsx(
            'w-full border rounded-md py-2 text-xs transition-colors appearance-none pr-8 cursor-pointer',
            isDark
              ? 'bg-[#0E1520] text-neutral-100 disabled:bg-[#0B0F17]'
              : 'bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400',
            'focus:outline-none focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            Icon ? 'pl-9' : 'pl-3',
            error
              ? 'border-rose-500 focus:border-rose-500'
              : isDark
              ? 'border-[#1E2B3C]'
              : 'border-slate-300',
            className
          )}
          {...props}
        >
          {children}
        </select>

        <div
          className={clsx(
            'absolute right-2.5 pointer-events-none flex items-center transition-colors',
            isDark ? 'text-neutral-400' : 'text-slate-400'
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {error ? (
        <p className="text-[10px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className={clsx('text-[10px]', isDark ? 'text-neutral-500' : 'text-slate-500')}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;

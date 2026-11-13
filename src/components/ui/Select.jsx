import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

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
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] font-medium text-neutral-300"
        >
          {label} {required && <span className="text-[#F4511E] font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-neutral-500 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          required={required}
          className={clsx(
            'w-full bg-[#0E1520] border rounded-md py-2 text-xs text-neutral-100 transition-colors appearance-none pr-8 cursor-pointer',
            'focus:outline-none focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]',
            'disabled:opacity-50 disabled:bg-[#0B0F17] disabled:cursor-not-allowed',
            Icon ? 'pl-9' : 'pl-3',
            error ? 'border-rose-500 focus:border-rose-500' : 'border-[#1E2B3C]',
            className
          )}
          {...props}
        >
          {children}
        </select>

        <div className="absolute right-2.5 text-neutral-400 pointer-events-none flex items-center">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {error ? (
        <p className="text-[10px] text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;


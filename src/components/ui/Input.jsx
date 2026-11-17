import { forwardRef } from 'react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    required = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const { isDark } = useApp();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-[11px] font-medium flex items-center justify-between transition-colors',
            isDark ? 'text-neutral-300' : 'text-slate-700'
          )}
        >
          <span>
            {label} {required && <span className="text-[#F4511E] font-bold">*</span>}
          </span>
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

        <input
          ref={ref}
          id={inputId}
          required={required}
          className={clsx(
            'w-full border rounded-md px-3 py-2 text-xs transition-colors',
            isDark
              ? 'bg-[#14171A] text-neutral-100 placeholder-neutral-500 disabled:bg-[#0E1012]'
              : 'bg-white text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400',
            'focus:outline-none focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            Icon ? 'pl-9' : 'pl-3',
            rightElement ? 'pr-10' : 'pr-3',
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : isDark
              ? 'border-[#22262A]'
              : 'border-slate-300',
            className
          )}
          {...props}
          onFocus={(e) => {
            if (props.type === 'number' && e.target.value === '0') {
              e.target.select();
            }
            props.onFocus?.(e);
          }}
        />

        {rightElement && (
          <div
            className={clsx(
              'absolute right-2.5 flex items-center text-xs transition-colors',
              isDark ? 'text-neutral-400' : 'text-slate-500'
            )}
          >
            {rightElement}
          </div>
        )}
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

export default Input;

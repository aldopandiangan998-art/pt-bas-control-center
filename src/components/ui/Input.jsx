import { forwardRef } from 'react';
import clsx from 'clsx';

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
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium text-neutral-300 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#F4511E] font-bold">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-neutral-500 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          className={clsx(
            'w-full bg-[#181B1E] border rounded-md px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 transition-colors',
            'focus:outline-none focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]',
            'disabled:opacity-50 disabled:bg-[#121416] disabled:cursor-not-allowed',
            Icon ? 'pl-9' : 'pl-3',
            rightElement ? 'pr-10' : 'pr-3',
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-[#2C3136]',
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-2.5 flex items-center text-xs text-neutral-400">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[10px] text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;

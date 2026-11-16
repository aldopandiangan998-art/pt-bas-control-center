import { useId } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * FilledField – base wrapper for all Material-style filled fields.
 * Provides: icon slot, floating label, required indicator, error/helper text, and bottom border focus line.
 */
export default function FilledField({
  icon: Icon,
  label,
  required = false,
  error = '',
  helper = '',
  focused = false,
  hasValue = false,
  disabled = false,
  rightSlot = null,
  onClick,
  children,
  id,
  className = '',
}) {
  const { isDark } = useApp();
  const labelUp = focused || hasValue;

  return (
    <div
      className={`relative flex flex-col ${className}`}
      onClick={onClick}
    >
      <div
        className={`
          relative flex items-center gap-0
          rounded-t-[4px]
          border-b-2 transition-colors duration-150
          min-h-[56px] px-0
          ${isDark ? 'bg-[#1E2126]' : 'bg-slate-100/90'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''}
          ${error ? 'border-rose-500' : focused ? 'border-[#F4511E]' : isDark ? 'border-[#3A3E45]' : 'border-slate-300'}
        `}
      >
        {/* Left icon */}
        {Icon && (
          <div
            className={`flex-none w-14 flex items-center justify-center transition-colors duration-150
            ${error ? 'text-rose-400' : focused ? 'text-[#F4511E]' : isDark ? 'text-neutral-500' : 'text-slate-400'}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Label + value area */}
        <div className={`relative flex-1 min-w-0 ${Icon ? '' : 'pl-4'} pr-2 pt-5 pb-1.5`}>
          {/* Floating label */}
          <label
            htmlFor={id}
            className={`
              absolute left-0 pointer-events-none select-none
              transition-all duration-[150ms] ease-in-out
              ${labelUp
                ? 'top-1.5 text-[11px] font-semibold tracking-wide'
                : 'top-1/2 -translate-y-1/2 text-[14px] font-normal'
              }
              ${error ? 'text-rose-400' : focused ? 'text-[#F4511E]' : labelUp ? (isDark ? 'text-neutral-400' : 'text-slate-600') : (isDark ? 'text-neutral-500' : 'text-slate-400')}
            `}
          >
            {label}
            {required && (
              <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
            )}
          </label>

          {/* Input slot */}
          <div className={`text-[14px] leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {children}
          </div>
        </div>

        {/* Right slot (chevron, etc.) */}
        {rightSlot && (
          <div className={`flex-none pr-3 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            {rightSlot}
          </div>
        )}
      </div>

      {/* Helper / Error text */}
      {(error || helper) && (
        <p
          id={id ? `${id}-hint` : undefined}
          className={`text-[11px] mt-1 px-4 leading-snug ${error ? 'text-rose-400' : isDark ? 'text-neutral-500' : 'text-slate-500'}`}
        >
          {error || helper}
        </p>
      )}
    </div>
  );
}

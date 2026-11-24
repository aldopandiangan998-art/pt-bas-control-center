import React from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * IndeterminateCheckbox
 * Universal custom-styled checkbox supporting Checked, Unchecked, and Indeterminate (Minimized) states.
 * When `indeterminate` is true (e.g. not all data is selected), it displays a clean minus/minimized symbol.
 */
export default function IndeterminateCheckbox({
  checked = false,
  indeterminate = false,
  onChange,
  className = '',
  title,
  size = 'sm', // 'xs' (14px), 'sm' (16px), 'md' (18px)
  disabled = false,
  ariaLabel,
}) {
  const isChecked = Boolean(checked);
  const isIndeterminate = !isChecked && Boolean(indeterminate);

  const sizeClasses =
    size === 'xs'
      ? 'w-3.5 h-3.5 rounded'
      : size === 'md'
      ? 'w-5 h-5 rounded-md'
      : 'w-4 h-4 rounded';

  const iconClasses =
    size === 'xs'
      ? 'w-2 h-2 stroke-[3]'
      : size === 'md'
      ? 'w-3.5 h-3.5 stroke-[3]'
      : 'w-2.5 h-2.5 stroke-[3]';

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || !onChange) return;
    onChange({
      target: { checked: !isChecked },
      stopPropagation: () => e.stopPropagation(),
      preventDefault: () => e.preventDefault(),
    });
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      aria-label={ariaLabel || title || 'Pilih item'}
      disabled={disabled}
      onClick={handleClick}
      title={title}
      className={`${sizeClasses} border flex items-center justify-center transition-colors cursor-pointer shrink-0 select-none focus:outline-none ${
        isChecked || isIndeterminate
          ? 'bg-[#F4511E] border-[#F4511E] text-white shadow-xs'
          : 'border-neutral-400 dark:border-neutral-500 hover:border-neutral-600 dark:hover:border-neutral-300 bg-white dark:bg-[#121417]/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isChecked && <Check className={iconClasses} />}
      {isIndeterminate && <Minus className={iconClasses} />}
    </button>
  );
}

import React, { forwardRef, useEffect, useRef } from 'react';

/**
 * Enterprise PT BAS Unified Checkbox Component
 * Clean, consistent checkbox with indeterminate & accessibility support
 */
const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    className = '',
    title = '',
    id,
    name,
    label,
    size = 'md', // 'sm' (16px) | 'md' (18px) | 'lg' (20px)
    ...props
  },
  forwardedRef
) {
  const innerRef = useRef(null);
  const ref = forwardedRef || innerRef;

  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, ref]);

  const sizeClasses = {
    sm: 'w-4 h-4 rounded',
    md: 'w-4.5 h-4.5 rounded-md',
    lg: 'w-5 h-5 rounded-md',
  }[size] || 'w-4.5 h-4.5 rounded-md';

  const checkboxInput = (
    <input
      ref={ref}
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      title={title}
      className={`${sizeClasses} cursor-pointer transition-all ${className}`}
      {...props}
    />
  );

  if (!label) return checkboxInput;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={title}
    >
      {checkboxInput}
      <span className="text-xs font-medium text-neutral-300 hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
});

export default Checkbox;

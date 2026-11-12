import { forwardRef } from 'react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-[#F4511E] hover:bg-[#D84315] active:bg-[#BF360C] text-white border-transparent shadow-sm',
  secondary: 'bg-[#1E2226] hover:bg-[#282C31] active:bg-[#32383E] text-neutral-200 border-[#30363D]',
  outline: 'bg-transparent hover:bg-[#1E2226] text-neutral-300 hover:text-white border-[#30363D]',
  ghost: 'bg-transparent hover:bg-[#1E2226] text-neutral-400 hover:text-white border-transparent',
  danger: 'bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-900 text-rose-400 border-rose-800/60',
  timber: 'bg-[#6B4219] hover:bg-[#7E4F20] text-amber-200 border-[#553312]',
};

const SIZES = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2.5',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary',
    size = 'sm',
    className = '',
    isLoading = false,
    disabled = false,
    icon: Icon,
    rightIcon: RightIcon,
    type = 'button',
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.secondary;
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md border transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0C0D0E]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      
      {children && <span>{children}</span>}

      {!isLoading && RightIcon && <RightIcon className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
});

export default Button;

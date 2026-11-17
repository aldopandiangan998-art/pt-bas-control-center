import { forwardRef } from 'react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

const getVariantClass = (variant, isDark) => {
  switch (variant) {
    case 'primary':
      return 'bg-[#F4511E] hover:bg-[#D84315] active:bg-[#BF360C] text-white border-transparent shadow-sm';
    case 'secondary':
      return isDark
        ? 'bg-[#16181B] hover:bg-[#1D2125] active:bg-[#22262A] text-neutral-200 border-[#2A2E33]'
        : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border-slate-300 shadow-xs';
    case 'outline':
      return isDark
        ? 'bg-transparent hover:bg-[#1D2125] text-neutral-200 hover:text-white border-[#2A2E33]'
        : 'bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 shadow-xs';
    case 'ghost':
      return isDark
        ? 'bg-transparent hover:bg-[#1D2125] text-neutral-300 hover:text-white border-transparent'
        : 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-transparent';
    case 'danger':
      return isDark
        ? 'bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-900 text-rose-400 border-rose-800/60'
        : 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border-rose-200 shadow-xs';
    case 'timber':
      return isDark
        ? 'bg-[#6B4219]/70 hover:bg-[#6B4219] text-amber-200 border-[#855320]'
        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-xs';
    default:
      return isDark
        ? 'bg-[#16181B] hover:bg-[#1D2125] active:bg-[#22262A] text-neutral-200 border-[#2A2E33]'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300';
  }
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs sm:text-[13px] gap-2',
  md: 'px-4 py-2 text-sm gap-2',
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
  const { isDark } = useApp();
  const variantClass = getVariantClass(variant, isDark);
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md border transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4511E] focus-visible:ring-offset-1',
        isDark ? 'focus-visible:ring-offset-[#0B0F17]' : 'focus-visible:ring-offset-white',
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

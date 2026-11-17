import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

const getVariantClasses = (variant, isDark) => {
  if (isDark) {
    switch (variant) {
      case 'success':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'warning':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'error':
      case 'danger':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'primary':
        return 'bg-[#F4511E]/20 text-[#FF7043] border-[#F4511E]/40';
      case 'timber':
        return 'bg-[#6B4219]/30 text-amber-200 border-[#6B4219]/60';
      case 'neutral':
      default:
        return 'bg-[#1C1F23] text-neutral-300 border-[#2A2E33]';
    }
  } else {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'primary':
        return 'bg-orange-50 text-[#F4511E] border-orange-200';
      case 'timber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }
};

const SIZES = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  dot = false,
}) {
  const { isDark } = useApp();
  const variantClass = getVariantClasses(variant, isDark);
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded border transition-colors',
        variantClass,
        sizeClass,
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-emerald-500': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-rose-500': variant === 'error' || variant === 'danger',
            'bg-slate-400': variant === 'neutral' && !isDark,
            'bg-neutral-400': variant === 'neutral' && isDark,
            'bg-[#F4511E]': variant === 'primary',
            'bg-amber-600': variant === 'timber',
          })}
        />
      )}
      {children}
    </span>
  );
}


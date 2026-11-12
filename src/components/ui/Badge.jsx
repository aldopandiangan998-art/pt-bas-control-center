import clsx from 'clsx';

const VARIANTS = {
  success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  error: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  neutral: 'bg-[#1C1F22] text-neutral-300 border-[#2E343A]',
  primary: 'bg-[#F4511E]/20 text-[#FF7043] border-[#F4511E]/40',
  timber: 'bg-[#6B4219]/30 text-amber-200 border-[#6B4219]/60',
};

const SIZES = {
  xs: 'px-1.5 py-0.2 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  dot = false,
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded border',
        variantClass,
        sizeClass,
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-emerald-400': variant === 'success',
            'bg-amber-400': variant === 'warning',
            'bg-rose-400': variant === 'error',
            'bg-neutral-400': variant === 'neutral',
            'bg-[#F4511E]': variant === 'primary',
          })}
        />
      )}
      {children}
    </span>
  );
}

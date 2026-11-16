import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

export function Card({ children, className = '', hover = false, ...props }) {
  const { isDark } = useApp();
  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-150',
        isDark
          ? 'bg-[#131D2D] border border-[#1E2B3E]'
          : 'bg-white border border-slate-200 shadow-sm text-slate-800',
        hover &&
          (isDark
            ? 'hover:border-[#2A3C56] hover:bg-[#18253A]'
            : 'hover:border-slate-300 hover:shadow-md'),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  const { isDark } = useApp();
  return (
    <div
      className={clsx(
        'px-4 py-3 border-b flex items-center justify-between transition-colors',
        isDark ? 'border-[#1E2B3E]' : 'border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  const { isDark } = useApp();
  return (
    <h3
      className={clsx(
        'text-xs font-bold tracking-wide uppercase transition-colors',
        isDark ? 'text-white' : 'text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  const { isDark } = useApp();
  return (
    <p
      className={clsx(
        'text-[11px] mt-0.5 transition-colors',
        isDark ? 'text-neutral-400' : 'text-slate-500',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={clsx('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  const { isDark } = useApp();
  return (
    <div
      className={clsx(
        'px-4 py-2.5 border-t rounded-b-lg flex items-center justify-between transition-colors',
        isDark ? 'bg-[#0F172A] border-[#1E2B3E]' : 'bg-slate-50 border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

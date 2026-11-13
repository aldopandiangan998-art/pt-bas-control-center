import clsx from 'clsx';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-[#131D2D] border border-[#1E2B3E] rounded-lg transition-all duration-150',
        hover && 'hover:border-[#2A3C56] hover:bg-[#18253A]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('px-4 py-3 border-b border-[#1E2B3E] flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={clsx('text-xs font-bold text-white tracking-wide uppercase', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={clsx('text-[11px] text-neutral-400 mt-0.5', className)} {...props}>
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
  return (
    <div
      className={clsx('px-4 py-2.5 bg-[#0F172A] border-t border-[#1E2B3E] rounded-b-lg flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}


import clsx from 'clsx';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-[#131517] border border-[#24282C] rounded-lg transition-all duration-150',
        hover && 'hover:border-[#383E45] hover:bg-[#171A1D]',
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
      className={clsx('px-4 py-3 border-b border-[#24282C] flex items-center justify-between', className)}
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
      className={clsx('px-4 py-2.5 bg-[#0F1113] border-t border-[#24282C] rounded-b-lg flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}


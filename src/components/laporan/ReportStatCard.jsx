import { useApp } from '../../context/AppContext';

export default function ReportStatCard({
  title,
  value,
  sublabel,
  icon: Icon,
  variant = 'orange', // 'orange' | 'emerald' | 'blue' | 'purple' | 'amber'
  className = '',
}) {
  const { isDark } = useApp();

  const variantStyles = {
    orange: {
      bg: isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50/70 border-orange-200',
      iconBg: 'bg-[#F4511E]/20 text-[#FF7043]',
      text: isDark ? 'text-white' : 'text-slate-900',
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      text: isDark ? 'text-white' : 'text-slate-900',
    },
    blue: {
      bg: isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50/70 border-blue-200',
      iconBg: 'bg-blue-500/20 text-blue-400',
      text: isDark ? 'text-white' : 'text-slate-900',
    },
    purple: {
      bg: isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50/70 border-purple-200',
      iconBg: 'bg-purple-500/20 text-purple-400',
      text: isDark ? 'text-white' : 'text-slate-900',
    },
    amber: {
      bg: isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50/70 border-amber-200',
      iconBg: 'bg-amber-500/20 text-amber-400',
      text: isDark ? 'text-white' : 'text-slate-900',
    },
  }[variant] || variantStyles.orange;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${variantStyles.bg} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 truncate">
            {title}
          </p>
          <p className={`text-lg sm:text-xl font-bold font-mono tracking-tight mt-1 truncate ${variantStyles.text}`}>
            {value}
          </p>
          {sublabel && (
            <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

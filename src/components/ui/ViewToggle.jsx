import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Enterprise View Mode Toggle (Grid vs List)
 * Standardized across all PT BAS pages with responsive labels and industrial theme
 */
export default function ViewToggle({
  viewMode = 'grid',
  onChange,
  className = '',
  gridTitle,
  listTitle,
  gridLabel = 'Grid',
  listLabel = 'List',
  showLabels = true,
}) {
  const appContext = useApp ? useApp() : null;
  const language = appContext?.language || 'id';
  const isDark = appContext?.isDark !== undefined ? appContext.isDark : true;

  const defaultGridTitle = gridTitle || (language === 'en' ? 'Grid / Cards View' : 'Tampilan Grid (Kartu)');
  const defaultListTitle = listTitle || (language === 'en' ? 'Table / List View' : 'Tampilan List (Tabel)');

  return (
    <div
      className={`flex items-center p-1 rounded-xl border shrink-0 gap-1 select-none transition-colors ${
        isDark
          ? 'bg-[#0E1012] border-[#22262A]'
          : 'bg-slate-100 border-slate-200'
      } ${className}`}
      role="group"
      aria-label={language === 'en' ? 'View mode switcher' : 'Pengalih mode tampilan'}
    >
      <button
        type="button"
        onClick={() => onChange && onChange('grid')}
        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
          viewMode === 'grid'
            ? 'bg-[#F4511E] text-white shadow-xs font-bold'
            : isDark
            ? 'text-neutral-400 hover:text-white hover:bg-white/5 font-medium'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
        }`}
        title={defaultGridTitle}
        aria-pressed={viewMode === 'grid'}
      >
        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span className="hidden sm:inline text-[11px]">{gridLabel}</span>}
      </button>

      <button
        type="button"
        onClick={() => onChange && onChange('list')}
        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
          viewMode === 'list'
            ? 'bg-[#F4511E] text-white shadow-xs font-bold'
            : isDark
            ? 'text-neutral-400 hover:text-white hover:bg-white/5 font-medium'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
        }`}
        title={defaultListTitle}
        aria-pressed={viewMode === 'list'}
      >
        <List className="w-3.5 h-3.5 shrink-0" />
        {showLabels && <span className="hidden sm:inline text-[11px]">{listLabel}</span>}
      </button>
    </div>
  );
}

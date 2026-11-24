import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * Enterprise PT BAS Search Bar
 * Standardized across all pages: uniform height, icons, clear button, focus ring
 */
const SearchBar = forwardRef(function SearchBar(
  {
    value = '',
    onChange,
    onClear,
    placeholder,
    className = '',
    containerClassName = '',
    shortcut = '',
    size = 'md', // 'sm' (py-1.5, 34px) | 'md' (py-2, 38px) | 'lg' (py-2.5, 42px)
    autoFocus = false,
    disabled = false,
    ...props
  },
  ref
) {
  const appContext = useApp ? useApp() : null;
  const language = appContext?.language || 'id';
  const isDark = appContext?.isDark !== undefined ? appContext.isDark : true;

  const defaultPlaceholder = placeholder || (language === 'en' ? 'Search data...' : 'Cari data...');
  const clearTooltip = language === 'en' ? 'Clear search' : 'Hapus pencarian';

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 text-xs pl-8 pr-8 rounded-lg',
    md: 'py-2 text-xs pl-9 pr-9 rounded-xl',
    lg: 'py-2.5 text-xs pl-10 pr-10 rounded-xl',
  }[size] || 'py-2 text-xs pl-9 pr-9 rounded-xl';

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-4 h-4 left-3.5',
  }[size] || 'w-4 h-4 left-3';

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      <Search
        className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none transition-colors ${iconSizes}`}
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={defaultPlaceholder}
        className={`w-full font-mono transition-all border outline-none ${
          isDark
            ? 'bg-[#0E1012] border-[#22262A] text-white placeholder-neutral-500 focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]'
            : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]'
        } ${sizeClasses} ${className}`}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer hover:bg-white/10"
          title={clearTooltip}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hidden sm:inline-block pointer-events-none font-medium">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
});

export default SearchBar;

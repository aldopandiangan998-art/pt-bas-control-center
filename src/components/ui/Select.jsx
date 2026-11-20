import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
} from 'react';
import clsx from 'clsx';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function extractOptions(children) {
  const options = [];

  const traverse = (child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      child.forEach(traverse);
      return;
    }
    if (child.type === React.Fragment) {
      React.Children.forEach(child.props.children, traverse);
      return;
    }
    if (child.type === 'option') {
      const value = child.props.value !== undefined ? child.props.value : child.props.children;
      let label = '';
      if (child.props.label) {
        label = String(child.props.label);
      } else if (typeof child.props.children === 'string' || typeof child.props.children === 'number') {
        label = String(child.props.children);
      } else if (Array.isArray(child.props.children)) {
        label = child.props.children
          .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
          .join('');
      } else {
        label = String(value ?? '');
      }

      options.push({
        value,
        label,
        disabled: Boolean(child.props.disabled),
        originalProps: child.props,
      });
      return;
    }
    if (child.props && child.props.children) {
      React.Children.forEach(child.props.children, traverse);
    }
  };

  React.Children.forEach(children, traverse);
  return options;
}

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    icon: Icon,
    required = false,
    className = '',
    children,
    id,
    value,
    defaultValue = '',
    onChange,
    disabled = false,
    placeholder,
    searchable = true,
    searchPlaceholder = 'Cari pilihan...',
    name,
    options: directOptions,
    title,
    ...props
  },
  ref
) {
  const { isDark } = useApp();
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [openUp, setOpenUp] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const nativeSelectRef = useRef(null);

  useImperativeHandle(ref, () => nativeSelectRef.current || triggerRef.current);

  // Extract all options from directOptions prop or children
  const parsedOptions = useMemo(() => {
    if (Array.isArray(directOptions)) {
      return directOptions.map((opt) =>
        typeof opt === 'string' || typeof opt === 'number'
          ? { value: opt, label: String(opt), disabled: false }
          : { value: opt.value, label: opt.label ?? String(opt.value), disabled: Boolean(opt.disabled) }
      );
    }
    return extractOptions(children);
  }, [children, directOptions]);

  const currentValue = value !== undefined ? value : defaultValue;

  // Selected option
  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => String(opt.value) === String(currentValue));
  }, [parsedOptions, currentValue]);

  // Display label on the trigger button
  const displayLabel = useMemo(() => {
    if (selectedOption) {
      return selectedOption.label;
    }
    if (currentValue !== undefined && currentValue !== '') {
      return String(currentValue);
    }
    // Check if there is an empty option (e.g. value === '')
    const emptyOpt = parsedOptions.find((opt) => opt.value === '' || opt.value === undefined);
    if (emptyOpt) {
      return emptyOpt.label;
    }
    return placeholder || (label ? `-- Pilih ${label} --` : '-- Pilih --');
  }, [selectedOption, currentValue, parsedOptions, placeholder, label]);

  const isPlaceholder = useMemo(() => {
    if (!currentValue && currentValue !== 0) return true;
    if (selectedOption && (selectedOption.value === '' || selectedOption.label.startsWith('--'))) {
      return true;
    }
    return false;
  }, [currentValue, selectedOption]);

  // Filter options based on typed search query (supports multi-term matching)
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return parsedOptions;
    const terms = search.toLowerCase().trim().split(/\s+/);
    return parsedOptions.filter((opt) => {
      // If it's a generic placeholder option with empty value, hide during search
      if (!opt.value && opt.label.startsWith('--')) return false;
      const labelLower = opt.label.toLowerCase();
      const valLower = String(opt.value).toLowerCase();
      return terms.every((term) => labelLower.includes(term) || valLower.includes(term));
    });
  }, [parsedOptions, search]);

  // Detect whether to open upwards or downwards depending on viewport space
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUp(spaceBelow < 260 && spaceAbove > spaceBelow);
  }, [isOpen]);

  // Close dropdown on outside click or touch
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Scroll highlighted item into view during keyboard navigation
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const handleSelect = (optValue) => {
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
    triggerRef.current?.focus();

    if (onChange) {
      const syntheticEvent = {
        target: {
          name: name || selectId,
          id: selectId,
          value: optValue,
        },
        currentTarget: {
          name: name || selectId,
          id: selectId,
          value: optValue,
        },
        value: optValue,
        preventDefault: () => {},
        stopPropagation: () => {},
        toString: () => String(optValue),
        valueOf: () => optValue,
      };
      onChange(syntheticEvent);
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex(0);
    }
  };

  return (
    <div ref={containerRef} className="w-full space-y-1 relative">
      {label && (
        <label
          htmlFor={selectId}
          className={clsx(
            'block text-[11px] font-medium transition-colors',
            isDark ? 'text-neutral-300' : 'text-slate-700'
          )}
        >
          {label} {required && <span className="text-[#F4511E] font-bold">*</span>}
        </label>
      )}

      {/* Hidden native select for form accessibility / validity / test harness */}
      <select
        ref={nativeSelectRef}
        id={selectId}
        name={name}
        required={required}
        disabled={disabled}
        value={currentValue}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
        {...props}
      >
        {children}
      </select>

      <div className="relative flex items-center">
        {Icon && (
          <div
            className={clsx(
              'absolute left-3 pointer-events-none flex items-center justify-center transition-colors z-10',
              isDark ? 'text-neutral-500' : 'text-slate-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          id={selectId ? `${selectId}-button` : undefined}
          disabled={disabled}
          title={title}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              setSearch('');
              setHighlightIndex(-1);
            }
          }}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={clsx(
            'w-full border rounded-md py-2 text-xs transition-colors appearance-none pr-8 text-left relative flex items-center',
            isDark
              ? 'bg-[#14171A] text-neutral-100'
              : 'bg-white text-slate-900',
            disabled && (isDark ? 'bg-[#0E1012] opacity-60 cursor-not-allowed' : 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'),
            !disabled && 'cursor-pointer',
            isOpen
              ? 'border-[#F4511E] ring-1 ring-[#F4511E]'
              : error
                ? 'border-rose-500 focus:border-rose-500'
                : isDark
                  ? 'border-[#22262A] hover:border-[#33383F]'
                  : 'border-slate-300 hover:border-slate-400',
            'focus:outline-none focus:border-[#F4511E] focus:ring-1 focus:ring-[#F4511E]',
            Icon ? 'pl-9' : 'pl-3',
            className
          )}
        >
          <span
            className={clsx(
              'block truncate select-none',
              isPlaceholder
                ? (isDark ? 'text-neutral-400 font-normal' : 'text-slate-400 font-normal')
                : (isDark ? 'text-neutral-100 font-medium' : 'text-slate-900 font-medium')
            )}
          >
            {displayLabel}
          </span>
        </button>

        <div
          className={clsx(
            'absolute right-2.5 pointer-events-none flex items-center transition-transform duration-200',
            isDark ? 'text-neutral-400' : 'text-slate-400',
            isOpen && 'rotate-180 text-[#F4511E]'
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className={clsx(
              'absolute z-50 w-full shadow-2xl rounded-lg border overflow-hidden animate-in fade-in zoom-in-95 duration-100',
              isDark
                ? 'bg-[#14171A] border-[#2A2E35] text-neutral-100 shadow-black/60'
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/20',
              openUp ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
            style={{ maxHeight: '320px' }}
          >
            {/* Search Input Bar */}
            {searchable && (
              <div
                className={clsx(
                  'flex items-center gap-2 px-2.5 py-2 border-b sticky top-0 z-10',
                  isDark ? 'bg-[#181B1F] border-[#262A30]' : 'bg-slate-50 border-slate-200'
                )}
              >
                <Search className={clsx('w-3.5 h-3.5 shrink-0', isDark ? 'text-neutral-500' : 'text-slate-400')} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className={clsx(
                    'flex-1 bg-transparent text-xs focus:outline-none',
                    isDark ? 'text-white placeholder:text-neutral-500' : 'text-slate-900 placeholder:text-slate-400'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightIndex((prev) => Math.max(prev - 1, 0));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (highlightIndex >= 0 && filteredOptions[highlightIndex] && !filteredOptions[highlightIndex].disabled) {
                        handleSelect(filteredOptions[highlightIndex].value);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsOpen(false);
                      setSearch('');
                      triggerRef.current?.focus();
                    } else if (e.key === 'Tab') {
                      setIsOpen(false);
                      setSearch('');
                    }
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setHighlightIndex(0);
                      searchInputRef.current?.focus();
                    }}
                    className={clsx(
                      'p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer',
                      isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              tabIndex={-1}
              className="overflow-y-auto py-1 max-h-56 divide-y divide-transparent focus:outline-none"
            >
              {filteredOptions.length === 0 ? (
                <li className={clsx('px-3 py-4 text-xs text-center flex flex-col items-center justify-center gap-1', isDark ? 'text-neutral-500' : 'text-slate-400')}>
                  <Search className="w-4 h-4 opacity-40 mb-0.5" />
                  <span>Tidak ada hasil yang cocok</span>
                  {search && <span className="text-[10px] opacity-75 font-mono">"{search}"</span>}
                </li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(currentValue);
                  const isHighlighted = idx === highlightIndex;
                  const isOptDisabled = opt.disabled;

                  return (
                    <li
                      key={`${opt.value}-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isOptDisabled}
                      title={opt.label}
                      onClick={() => {
                        if (!isOptDisabled) {
                          handleSelect(opt.value);
                        }
                      }}
                      onMouseEnter={() => !isOptDisabled && setHighlightIndex(idx)}
                      className={clsx(
                        'px-3 py-2 text-xs flex items-center justify-between transition-colors select-none',
                        isOptDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer',
                        !isOptDisabled && (
                          isHighlighted
                            ? (isDark ? 'bg-[#22272E] text-white' : 'bg-slate-100 text-slate-900')
                            : (isDark ? 'hover:bg-[#1A1D21] text-neutral-200' : 'hover:bg-slate-50 text-slate-700')
                        ),
                        isSelected && 'text-[#F4511E] font-semibold bg-[#F4511E]/10'
                      )}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#F4511E] shrink-0 ml-auto" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[10px] text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className={clsx('text-[10px]', isDark ? 'text-neutral-500' : 'text-slate-500')}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search, Check } from 'lucide-react';
import FilledField from './FilledField';

/**
 * SelectField – custom dropdown replacing native <select>.
 * Features: floating label, keyboard navigation, optional search, accessible combobox pattern.
 */
export default function SelectField({
  icon,
  label,
  value = '',
  onChange,
  options = [],       // [{ value, label }] or string[]
  required = false,
  disabled = false,
  error = '',
  helper = '',
  searchable = false,
  placeholder = '',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const uid = useId();
  const listId = `${uid}-list`;
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label }
  const normalizedOptions = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const filtered = search
    ? normalizedOptions.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  const selectedLabel = normalizedOptions.find((o) => o.value === value)?.label || '';
  const hasValue = !!value;

  // Auto-detect if menu should open upward
  const [openUp, setOpenUp] = useState(false);
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuH = Math.min(filtered.length * 48 + (searchable ? 48 : 0) + 16, window.innerHeight * 0.4);
    setOpenUp(spaceBelow < menuH && rect.top > menuH);
  }, [open, filtered.length, searchable]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
        setHighlightIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when menu opens
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx < 0 || !listRef.current) return;
    const item = listRef.current.querySelectorAll('[role="option"]')[highlightIdx];
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  const selectOption = useCallback((opt) => {
    onChange?.(opt.value);
    setOpen(false);
    setSearch('');
    setHighlightIdx(-1);
    triggerRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setHighlightIdx(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlightIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightIdx(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIdx >= 0 && filtered[highlightIdx]) {
          selectOption(filtered[highlightIdx]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearch('');
        setHighlightIdx(-1);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <FilledField
        id={uid}
        icon={icon}
        label={label}
        required={required}
        error={error}
        helper={helper}
        focused={open}
        hasValue={hasValue}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        rightSlot={
          open
            ? <ChevronUp className="w-4 h-4 transition-transform duration-150" />
            : <ChevronDown className="w-4 h-4 transition-transform duration-150" />
        }
      >
        <button
          ref={triggerRef}
          type="button"
          id={uid}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-required={required}
          aria-describedby={error || helper ? `${uid}-hint` : undefined}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className="w-full text-left bg-transparent focus:outline-none text-[14px] leading-tight cursor-pointer"
        >
          {hasValue ? (
            <span className="text-white">{selectedLabel}</span>
          ) : (
            <span className="text-transparent select-none">{placeholder || label}</span>
          )}
        </button>
      </FilledField>

      {/* Dropdown menu */}
      {open && (
        <div
          className={`
            absolute z-50 w-full bg-[#1E2126] border border-[#3A3E45]
            shadow-xl overflow-hidden
            ${openUp ? 'bottom-full mb-1 rounded-t-lg rounded-b-sm' : 'top-full mt-0 rounded-b-lg rounded-t-sm'}
          `}
          style={{ maxHeight: '40vh' }}
          onKeyDown={handleKeyDown}
        >
          {/* Search box */}
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2A2E35]">
              <Search className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHighlightIdx(0); }}
                placeholder="Cari..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-neutral-500"
              />
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="overflow-y-auto"
            style={{ maxHeight: searchable ? 'calc(40vh - 48px)' : '40vh' }}
          >
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-neutral-500 text-center">Tidak ditemukan</li>
            )}
            {filtered.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightIdx;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`
                    flex items-center justify-between px-4 h-12 text-sm cursor-pointer select-none transition-colors
                    ${isHighlighted ? 'bg-[#2A2E35]' : 'hover:bg-[#262A30]'}
                    ${isSelected ? 'text-[#F4511E]' : 'text-neutral-200'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

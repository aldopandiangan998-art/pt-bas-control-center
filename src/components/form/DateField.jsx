import { useState, useId } from 'react';
import { Calendar } from 'lucide-react';
import FilledField from './FilledField';
import { useApp } from '../../context/AppContext';

/**
 * DateField – date input using FilledField Material style.
 * Uses <input type="date"> with adaptive color-scheme.
 */
export default function DateField({
  label = 'Tanggal',
  value = '',
  onChange,
  required = false,
  disabled = false,
  error = '',
  helper = '',
  className = '',
  min,
  max,
  ...props
}) {
  const { isDark } = useApp();
  const [focused, setFocused] = useState(false);
  const uid = useId();

  return (
    <FilledField
      id={uid}
      icon={Calendar}
      label={label}
      required={required}
      error={error}
      helper={helper}
      focused={focused}
      hasValue={!!value}
      disabled={disabled}
      className={className}
    >
      <input
        id={uid}
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        {...props}
        aria-required={required}
        aria-describedby={error || helper ? `${uid}-hint` : undefined}
        style={{ colorScheme: isDark ? 'dark' : 'light' }}
        className={`w-full bg-transparent focus:outline-none text-[14px] font-mono ${
          isDark ? 'text-white' : 'text-slate-900 font-medium'
        }`}
      />
    </FilledField>
  );
}

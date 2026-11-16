import { useState, useId } from 'react';
import FilledField from './FilledField';
import { useApp } from '../../context/AppContext';

/**
 * NumberField – numeric input that stores a raw number in state but can display formatted value.
 * Uses inputMode="decimal" for mobile keyboard.
 */
export default function NumberField({
  icon,
  label,
  value = '',
  onChange,
  required = false,
  disabled = false,
  error = '',
  helper = '',
  min,
  max,
  step,
  className = '',
}) {
  const { isDark } = useApp();
  const [focused, setFocused] = useState(false);
  const uid = useId();

  return (
    <FilledField
      id={uid}
      icon={icon}
      label={label}
      required={required}
      error={error}
      helper={helper}
      focused={focused}
      hasValue={value !== '' && value !== undefined && value !== null}
      disabled={disabled}
      className={className}
    >
      <input
        id={uid}
        type="number"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        aria-required={required}
        aria-describedby={error || helper ? `${uid}-hint` : undefined}
        className={`w-full bg-transparent focus:outline-none text-[14px] font-mono ${
          isDark ? 'text-white' : 'text-slate-900 font-medium'
        }`}
      />
    </FilledField>
  );
}

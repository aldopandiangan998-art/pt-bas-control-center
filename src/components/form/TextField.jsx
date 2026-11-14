import { useState, useId } from 'react';
import FilledField from './FilledField';

/**
 * TextField – single-line text input using FilledField styling.
 */
export default function TextField({
  icon,
  label,
  value = '',
  onChange,
  required = false,
  readOnly = false,
  disabled = false,
  placeholder = '',
  helper = '',
  error = '',
  inputMode,
  autoComplete,
  className = '',
}) {
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
      hasValue={!!value}
      disabled={disabled || readOnly}
      className={className}
    >
      <input
        id={uid}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={focused ? placeholder : ''}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-required={required}
        aria-describedby={error || helper ? `${uid}-hint` : undefined}
        className={`
          w-full bg-transparent focus:outline-none text-[14px]
          placeholder-neutral-600
          ${readOnly ? 'text-neutral-400 cursor-not-allowed font-mono' : 'text-white'}
        `}
      />
    </FilledField>
  );
}

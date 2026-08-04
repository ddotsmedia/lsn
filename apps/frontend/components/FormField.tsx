'use client';

import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select';

export interface FormFieldProps {
  label: string;
  type: FormFieldType;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  options?: readonly SelectOption[];
  placeholder?: string;
  autoComplete?: string;
  /** Bounds for date inputs, ISO YYYY-MM-DD. */
  min?: string;
  max?: string;
  hint?: string;
  rows?: number;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

export const CONTROL_CLASSES =
  'w-full rounded-lg border-2 border-gray-300 bg-white p-3 text-base text-gray-800 ' +
  'transition-all duration-200 ease-in-out placeholder:text-gray-400 ' +
  'focus:border-red-600 focus:shadow-md focus:outline-none';

export const CONTROL_ERROR_CLASSES = 'border-red-600';

export const LABEL_CLASSES = 'mb-2 block text-sm font-semibold text-gray-700';

/**
 * Reusable labelled control. Renders an input, textarea or select depending on
 * `type`, and wires the error message to the control with aria-describedby so
 * screen reader users hear the reason a field was rejected.
 */
export function FormField({
  label,
  type,
  name,
  value,
  onChange,
  error,
  required = false,
  options,
  placeholder,
  autoComplete,
  min,
  max,
  hint,
  rows = 4,
}: FormFieldProps) {
  const reactId = useId();
  const controlId = `${reactId}-${name}`;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const shared = {
    id: controlId,
    name,
    value,
    required,
    'aria-required': required || undefined,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy,
    className: cx(CONTROL_CLASSES, error && CONTROL_ERROR_CLASSES),
  };

  return (
    <div className="mb-6 md:mb-8">
      <label htmlFor={controlId} className={LABEL_CLASSES}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          {...shared}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cx(shared.className, 'resize-y')}
        />
      ) : type === 'select' ? (
        <select {...shared} onChange={(event) => onChange(event.target.value)}>
          <option value="">Please choose…</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;

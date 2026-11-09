import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Text shown inside the right edge of the input, e.g. "mg/dl" */
  suffix?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Label + input + hint + error, wired together for screen readers. */
export function TextField({ id, label, error, hint, suffix, className, ref, ...inputProps }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`input-wrap${suffix ? ' input-wrap--suffix' : ''}`}>
        <input
          ref={ref}
          id={id}
          className="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {suffix && (
          <span className="input-suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

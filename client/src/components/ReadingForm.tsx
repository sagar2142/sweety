import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/http';
import { SLOT_OPTIONS } from '../lib/slots';
import {
  MAX_VALUE,
  MIN_VALUE,
  validateReadingForm,
  type ReadingFormErrors,
  type ReadingFormValues,
} from '../lib/validation';
import type { ReadingInput } from '../types';
import { Alert } from './Alert';
import { TextField } from './TextField';

interface ReadingFormProps {
  /** Today's date ('YYYY-MM-DD'); later dates are rejected. */
  today: string;
  /** Pass an existing reading to edit it; leave empty to add a new one. */
  initial?: ReadingInput;
  /** Saves the reading. Throw an ApiError to show the server's message. */
  onSubmit: (input: ReadingInput) => Promise<void>;
  onCancel?: () => void;
}

type Field = keyof ReadingFormValues;
const FIELD_ORDER: Field[] = ['date', 'slot', 'value'];

export function ReadingForm({ today, initial, onSubmit, onCancel }: ReadingFormProps) {
  const isEdit = initial !== undefined;
  const id = useId();
  const [values, setValues] = useState<ReadingFormValues>(() =>
    initial
      ? { date: initial.date, slot: initial.slot, value: String(initial.value) }
      : { date: today, slot: '', value: '' },
  );
  const [errors, setErrors] = useState<ReadingFormErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  // When editing starts, jump straight to the value (also scrolls the form into view).
  useEffect(() => {
    if (isEdit) valueRef.current?.focus();
  }, [isEdit]);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  /** Moves keyboard focus to the first field with an error. */
  function focusFirstError(found: ReadingFormErrors) {
    const refs = { date: dateRef, slot: slotRef, value: valueRef };
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) refs[first].current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { errors: found, input } = validateReadingForm(values, today);
    if (!input) {
      setErrors(found);
      focusFirstError(found);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
      // Ready for the next reading on the same day.
      if (!isEdit) setValues({ date: input.date, slot: '', value: '' });
    } catch (error) {
      const fieldErrors = error instanceof ApiError ? pickFieldErrors(error.fields) : {};
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        focusFirstError(fieldErrors);
      } else {
        setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const slotErrorId = `${id}-slot-error`;

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit reading' : 'Add reading'}>
      {formError && <Alert>{formError}</Alert>}

      <TextField
        ref={dateRef}
        id={`${id}-date`}
        label="Date"
        type="date"
        max={today}
        value={values.date}
        error={errors.date}
        onChange={(event) => update('date', event.target.value)}
      />

      <fieldset
        className="field slot-field"
        aria-describedby={errors.slot ? slotErrorId : undefined}
        aria-invalid={errors.slot ? true : undefined}
      >
        <legend className="field__label">Time slot</legend>
        <div className="slot-options">
          {SLOT_OPTIONS.map((slot, index) => (
            <label key={slot.value} className="slot-option">
              <input
                ref={index === 0 ? slotRef : undefined}
                type="radio"
                name={`${id}-slot`}
                value={slot.value}
                checked={values.slot === slot.value}
                onChange={() => update('slot', slot.value)}
              />
              <span className="slot-option__text">
                <span className="slot-option__label">{slot.label}</span>
                <span className="slot-option__hint">{slot.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.slot && (
          <p id={slotErrorId} className="field__error">
            {errors.slot}
          </p>
        )}
      </fieldset>

      <TextField
        ref={valueRef}
        id={`${id}-value`}
        label="Glucose value"
        type="number"
        inputMode="numeric"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step={1}
        placeholder="e.g. 110"
        suffix="mg/dl"
        hint={`Whole number from ${MIN_VALUE} to ${MAX_VALUE}`}
        value={values.value}
        error={errors.value}
        onChange={(event) => update('value', event.target.value)}
      />

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add reading'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/** Keeps only the API field errors that belong to this form. */
function pickFieldErrors(fields: Record<string, string>): ReadingFormErrors {
  const result: ReadingFormErrors = {};
  for (const field of FIELD_ORDER) {
    if (fields[field]) result[field] = fields[field];
  }
  return result;
}

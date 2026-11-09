import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

type Field = 'name' | 'email' | 'password';
type Errors = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same rules and messages as the API. */
function validate(values: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Please enter your name.';
  else if (values.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (values.password.length > 72) errors.password = 'Password must be 72 characters or fewer.';
  return errors;
}

export function RegisterPage() {
  const { register } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register(values.name.trim(), values.email.trim(), values.password);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) setErrors(error.fields);
      else setFormError(error instanceof Error ? error.message : 'Could not create your account.');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start logging up to 4 readings a day."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert>{formError}</Alert>}
        <TextField
          id="register-name"
          label="Full name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <TextField
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={values.password}
          error={errors.password}
          onChange={(event) => update('password', event.target.value)}
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}

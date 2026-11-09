import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/http';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

type Errors = Partial<Record<'email' | 'password', string>>;

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!email.trim()) found.email = 'Please enter your email.';
    if (!password) found.password = 'Please enter your password.';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
      // <PublicOnly> redirects to the app once the user is logged in.
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) setErrors(error.fields);
      else setFormError(error instanceof Error ? error.message : 'Could not log in.');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to record and review your glucose readings."
      footer={
        <>
          New to Sweety? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert>{formError}</Alert>}
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="demo-hint">
        <p className="demo-hint__title">Demo account</p>
        <p>
          <code>demo@sweety.app</code> / <code>Demo@1234</code>
          <span className="demo-hint__note"> (created by the seed script)</span>
        </p>
      </div>
    </AuthLayout>
  );
}

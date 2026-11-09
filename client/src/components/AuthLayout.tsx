import type { ReactNode } from 'react';
import { DropIcon } from './Icons';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Centered card used by the login and sign-up pages. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand__mark brand__mark--lg">
            <DropIcon size={24} strokeWidth={2.4} />
          </span>
          <span className="brand__name">Sweety</span>
        </div>
        <div className="card auth-card">
          <h1 className="auth-card__title">{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
          {children}
        </div>
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  );
}

import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon } from './Icons';

interface AlertProps {
  tone?: 'error' | 'success';
  children: ReactNode;
  action?: ReactNode;
}

/** Inline message box. Errors are announced immediately to screen readers. */
export function Alert({ tone = 'error', children, action }: AlertProps) {
  const ToneIcon = tone === 'error' ? AlertIcon : CheckIcon;
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <ToneIcon size={18} className="alert__icon" />
      <div className="alert__body">{children}</div>
      {action && <div className="alert__action">{action}</div>}
    </div>
  );
}

import { useEffect } from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

/** A short success message that hides itself after a few seconds. */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast">
          <CheckIcon size={18} strokeWidth={2.5} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

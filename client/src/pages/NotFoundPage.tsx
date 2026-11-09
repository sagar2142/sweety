import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <EmptyState
          title="Page not found"
          description="The page you are looking for does not exist."
          action={
            <Link to="/" className="btn btn--primary">
              Go to my readings
            </Link>
          }
        />
      </div>
    </main>
  );
}

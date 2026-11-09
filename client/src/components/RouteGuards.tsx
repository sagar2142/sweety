import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './PageLoader';

/** Only logged-in users can see these pages; others are sent to /login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <PageLoader />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Login and sign-up pages: logged-in users go to the page they wanted (or home). */
export function PublicOnly() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <PageLoader />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith('/') ? from : '/'} replace />;
  }
  return <Outlet />;
}

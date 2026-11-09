import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { PageLoader } from './components/PageLoader';
import { PublicOnly, RequireAuth } from './components/RouteGuards';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReadingsPage } from './pages/ReadingsPage';
import { RegisterPage } from './pages/RegisterPage';

// The reports page includes the charting library, so it is loaded only when opened.
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<ReadingsPage />} />
              <Route
                path="/reports"
                element={
                  <Suspense fallback={<PageLoader label="Loading reports…" />}>
                    <ReportsPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

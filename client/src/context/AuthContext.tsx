import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { onUnauthorized, tokenStorage } from '../api/http';
import type { User } from '../types';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'checking' : 'anonymous'));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // If a saved token exists, check it is still valid and load the user.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Any API call that comes back 401 (expired token) logs the user out.
  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    tokenStorage.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register({ name, email, password });
    tokenStorage.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

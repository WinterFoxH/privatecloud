import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, login as apiLogin, logoutLocal } from '../api/authApi';
import { getAccessToken } from '../api/tokenStorage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    logoutLocal();
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    void fetchMe()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

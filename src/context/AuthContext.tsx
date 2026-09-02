import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: Record<UserRole, User> = {
  user: { id: 'u1', name: 'Jan Kowalski', email: 'jan@dom.local', role: 'user' },
  admin: { id: 'a1', name: 'Admin Serwera', email: 'admin@cloud.local', role: 'admin' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string, role: UserRole) => {
    setUser({ ...DEMO_USERS[role], email: email || DEMO_USERS[role].email });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

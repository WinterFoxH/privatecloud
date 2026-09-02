import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: '2rem' }}>Ładowanie sesji…</p>;
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

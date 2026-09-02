import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('jan@dom.local');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/files', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      navigate(loggedIn.role === 'admin' ? '/admin/dashboard' : '/files');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Logowanie nie powiodło się';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Cloud size={40} />
          <h1>PrivateCloud</h1>
          <p>Logowanie — Faza 3 (JWT + API)</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="login-form">
          <label>
            E-mail
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@dom.local"
                required
              />
            </div>
          </label>

          <label>
            Hasło
            <div className="input-wrap">
              <Lock size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}

          <button type="submit" className="btn-primary full" disabled={submitting}>
            {submitting ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </form>

        <p className="login-hint">
          Demo: jan@dom.local / demo1234 (user) lub admin@cloud.local / admin1234 (admin)
        </p>
      </div>
    </div>
  );
}

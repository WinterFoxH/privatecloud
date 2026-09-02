import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('jan@dom.local');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<UserRole>('user');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login(email, password, role);
    navigate(role === 'admin' ? '/admin/dashboard' : '/files');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Cloud size={40} />
          <h1>PrivateCloud</h1>
          <p>Prototyp systemu chmury prywatnej — logowanie (UC-LOG)</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            E-mail
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uzytkownik@dom.local"
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

          <fieldset className="role-picker">
            <legend>Rola</legend>
            <label className="radio-card">
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={() => setRole('user')}
              />
              <div>
                <strong>Użytkownik końcowy</strong>
                <span>Pliki, multimedia, synchronizacja, udostępnianie</span>
              </div>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={() => setRole('admin')}
              />
              <div>
                <strong>Administrator systemu</strong>
                <span>Dashboard, pula dyskowa, monitoring</span>
              </div>
            </label>
          </fieldset>

          <button type="submit" className="btn-primary full">
            Zaloguj się
          </button>
        </form>

        <p className="login-hint">
          Demo: dowolne hasło. Wybierz rolę, aby zobaczyć odpowiednie przypadki użycia.
        </p>
      </div>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Cloud,
  FolderOpen,
  Image,
  RefreshCw,
  Share2,
  LayoutDashboard,
  HardDrive,
  GitBranch,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { to: '/files', label: 'Pliki', icon: FolderOpen },
  { to: '/media', label: 'Multimedia', icon: Image },
  { to: '/sync', label: 'Synchronizacja', icon: RefreshCw },
  { to: '/sharing', label: 'Udostępnianie', icon: Share2 },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/disks', label: 'Pula dyskowa', icon: HardDrive },
];

const metaLinks = [{ to: '/diagram', label: 'Diagram przypadków użycia', icon: GitBranch }];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links =
    user?.role === 'admin'
      ? [...userLinks, ...adminLinks, ...metaLinks]
      : [...userLinks, ...metaLinks];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Cloud size={28} />
          <div>
            <strong>PrivateCloud</strong>
            <span>Prototyp MVP</span>
          </div>
          <button type="button" className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{user?.name.charAt(0)}</span>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role === 'admin' ? 'Administrator' : 'Użytkownik'}</span>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            <LogOut size={16} />
            Wyloguj
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h1>System chmury prywatnej</h1>
          <span className="status-pill online">Serwer online</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

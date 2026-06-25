import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export function Header({ title = 'TIPPER', back, right }) {
  const navigate = useNavigate();
  return (
    <div className="header">
      <button className="icon-btn" onClick={() => (back ? navigate(back) : navigate(-1))} aria-label="Retour">
        {back === null ? '' : '←'}
      </button>
      <div className="brand">{title}</div>
      <div style={{ width: 38, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadNotif, unreadMsg } = useApp();
  const items = [
    { to: '/', ico: '🏠', label: 'Accueil', match: (p) => p === '/' || p.startsWith('/feed') || p.startsWith('/categories') || p.startsWith('/ads') || p.startsWith('/post') },
    { to: '/wallet', ico: '👛', label: 'Wallet', match: (p) => p.startsWith('/wallet') },
    { to: '/messages', ico: '💬', label: 'Messages', match: (p) => p.startsWith('/messages'), badge: unreadMsg },
    { to: '/notifications', ico: '🔔', label: 'Alertes', match: (p) => p.startsWith('/notifications'), badge: unreadNotif },
    { to: '/profile', ico: '👤', label: 'Profil', match: (p) => p.startsWith('/profile') },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <button key={it.to} className={`nav-item ${it.match(pathname) ? 'active' : ''}`} onClick={() => navigate(it.to)}>
          {it.badge > 0 && <span className="nav-badge">{it.badge > 9 ? '9+' : it.badge}</span>}
          <span className="ico">{it.ico}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Screen({ children, nav = true }) {
  return (
    <div className="app-shell">
      {children}
      {nav && <BottomNav />}
    </div>
  );
}

export function Spinner() { return <div className="spinner" />; }

export function Empty({ icon = '🤷', title, hint }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {hint && <div style={{ marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

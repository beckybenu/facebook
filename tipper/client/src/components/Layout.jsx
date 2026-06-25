import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { initials, avatarColor } from '../constants.js';

export function AppBar({ title, subtitle, back, right, brand }) {
  const navigate = useNavigate();
  return (
    <div className="appbar">
      {back !== undefined && back !== false && (
        <button className="iconbtn plain" style={{ width: 32 }} onClick={() => (back ? navigate(back) : navigate(-1))}>←</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {brand
          ? <div className="wordmark" style={{ fontSize: 22 }}>Tipper<span className="dot">.</span></div>
          : <div className="ab-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {subtitle && <div className="ab-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadNotif, unreadMsg } = useApp();
  const is = (m) => m.test(pathname);
  return (
    <nav className="nav">
      <button className={`n ${is(/^\/$|^\/home/) ? 'active' : ''}`} onClick={() => navigate('/')}>
        <span className="ic">🏠</span><span>Accueil</span>
      </button>
      <button className={`n ${is(/^\/explore|^\/map|^\/ads/) ? 'active' : ''}`} onClick={() => navigate('/explore')}>
        <span className="ic">🧭</span><span>Explorer</span>
      </button>
      <button className="fab" onClick={() => navigate('/categories')} aria-label="Publier">＋</button>
      <button className={`n ${is(/^\/messages|^\/notifications/) ? 'active' : ''}`} onClick={() => navigate('/messages')}>
        {(unreadMsg + unreadNotif) > 0 && <span className="nb">{Math.min(9, unreadMsg + unreadNotif)}</span>}
        <span className="ic">💬</span><span>Boîte</span>
      </button>
      <button className={`n ${is(/^\/profile|^\/wallet|^\/leaderboard/) ? 'active' : ''}`} onClick={() => navigate('/profile')}>
        <span className="ic">👤</span><span>Profil</span>
      </button>
    </nav>
  );
}

export function Screen({ children, nav = true }) {
  return (
    <div className="app-shell">
      {children}
      {nav && <Nav />}
    </div>
  );
}

export function Avatar({ user, size = 'm' }) {
  if (!user) return null;
  return (
    <div className={`av ${size}`} style={{ background: avatarColor(user.full_name || '') }}>
      {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.full_name)}
    </div>
  );
}

export function Stars({ value, count, size = 13 }) {
  if (value == null) return <span className="muted" style={{ fontSize: size }}>Nouveau</span>;
  const full = Math.round(value);
  return (
    <span className="stars" style={{ fontSize: size }}>
      {'★★★★★'.slice(0, full)}<span style={{ color: 'var(--line)' }}>{'★★★★★'.slice(full)}</span>
      <span className="num">{value}{count != null ? ` (${count})` : ''}</span>
    </span>
  );
}

export function Spinner() { return <div className="spinner" />; }

export function Empty({ icon = '🤷', title, hint, action }) {
  return (
    <div className="empty fade-in">
      <div className="big">{icon}</div>
      <div className="t">{title}</div>
      {hint && <div style={{ marginTop: 6 }}>{hint}</div>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

export function Sheet({ children, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        {children}
      </div>
    </div>
  );
}

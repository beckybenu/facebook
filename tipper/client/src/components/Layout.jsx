import { useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { initials, avatarColor } from '../constants.js';
import { feedback } from '../sound.js';

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
  const refs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 });

  const items = [
    { key: 'home', ico: '🏠', label: 'Accueil', to: '/', re: /^\/$|^\/home/ },
    { key: 'explore', ico: '🧭', label: 'Explorer', to: '/explore', re: /^\/explore|^\/map|^\/ads/ },
    { key: 'boite', ico: '💬', label: 'Boîte', to: '/messages', re: /^\/messages|^\/notifications/, badge: unreadMsg + unreadNotif },
    { key: 'profil', ico: '👤', label: 'Profil', to: '/profile', re: /^\/profile|^\/wallet|^\/leaderboard/ },
  ];
  const activeKey = items.find((i) => i.re.test(pathname))?.key;

  useLayoutEffect(() => {
    const el = refs.current[activeKey];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    else setInd((s) => ({ ...s, opacity: 0 }));
  }, [activeKey, unreadNotif, unreadMsg]);

  const go = (to) => { feedback('nav'); navigate(to); };

  return (
    <nav className="nav">
      <span className="nav-ind" style={{ left: ind.left, width: ind.width, opacity: ind.opacity }} />
      <button ref={(e) => (refs.current.home = e)} className={`n ${activeKey === 'home' ? 'active' : ''}`} onClick={() => go('/')}>
        <span className="ic">🏠</span><span>Accueil</span>
      </button>
      <button ref={(e) => (refs.current.explore = e)} className={`n ${activeKey === 'explore' ? 'active' : ''}`} onClick={() => go('/explore')}>
        <span className="ic">🧭</span><span>Explorer</span>
      </button>
      <button className="fab" onClick={() => { feedback('tap'); navigate('/categories'); }} aria-label="Publier">＋</button>
      <button ref={(e) => (refs.current.boite = e)} className={`n ${activeKey === 'boite' ? 'active' : ''}`} onClick={() => go('/messages')}>
        {(unreadMsg + unreadNotif) > 0 && <span className="nb">{Math.min(9, unreadMsg + unreadNotif)}</span>}
        <span className="ic">💬</span><span>Boîte</span>
      </button>
      <button ref={(e) => (refs.current.profil = e)} className={`n ${activeKey === 'profil' ? 'active' : ''}`} onClick={() => go('/profile')}>
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

export function Avatar({ user, size = 'm', glow = false }) {
  if (!user) return null;
  const inner = (
    <div className={`av ${size}`} style={{ background: avatarColor(user.full_name || '') }}>
      {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.full_name)}
    </div>
  );
  return glow ? <div className="av-glow">{inner}</div> : inner;
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

import { motion } from 'framer-motion';
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
  const items = [
    { key: 'home', ico: '🏠', label: 'Accueil', to: '/', re: /^\/$|^\/home/ },
    { key: 'explore', ico: '🧭', label: 'Explorer', to: '/explore', re: /^\/explore|^\/map|^\/ads/ },
    { fab: true },
    { key: 'boite', ico: '💬', label: 'Boîte', to: '/messages', re: /^\/messages|^\/notifications/, badge: unreadMsg + unreadNotif },
    { key: 'profil', ico: '👤', label: 'Profil', to: '/profile', re: /^\/profile|^\/wallet|^\/leaderboard|^\/admin/ },
  ];
  const activeKey = items.find((i) => i.re && i.re.test(pathname))?.key;
  const go = (to) => { feedback('nav'); navigate(to); };
  const spring = { type: 'spring', stiffness: 380, damping: 30 };

  return (
    <nav className="nav">
      {items.map((it, i) => it.fab ? (
        <motion.button key="fab" className="fab" whileTap={{ scale: 0.88 }} transition={spring}
          onClick={() => { feedback('tap'); navigate('/now'); }} aria-label="Tipper Now">⚡</motion.button>
      ) : (
        <button key={it.key} className={`n ${activeKey === it.key ? 'active' : ''}`} onClick={() => go(it.to)}>
          {activeKey === it.key && <motion.span className="nav-ind-fm" layoutId="navind" transition={spring} />}
          {it.badge > 0 && <span className="nb">{Math.min(9, it.badge)}</span>}
          <span className="nav-inner"><span className="ic">{it.ico}</span><span>{it.label}</span></span>
        </button>
      ))}
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

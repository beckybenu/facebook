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
  const { unreadNotif, unreadMsg, t } = useApp();
  const refs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 });

  const items = [
    { key: 'home', ico: '🏠', label: t('nav.home'), to: '/', re: /^\/$|^\/home/ },
    { key: 'explore', ico: '🧭', label: t('nav.explore'), to: '/explore', re: /^\/explore|^\/map|^\/ads/ },
    { key: 'boite', ico: '💬', label: t('nav.inbox'), to: '/messages', re: /^\/messages|^\/notifications/, badge: unreadMsg + unreadNotif },
    { key: 'profil', ico: '👤', label: t('nav.profile'), to: '/profile', re: /^\/profile|^\/wallet|^\/leaderboard/ },
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
        <span className="ic">🏠</span><span>{t('nav.home')}</span>
      </button>
      <button ref={(e) => (refs.current.explore = e)} className={`n ${activeKey === 'explore' ? 'active' : ''}`} onClick={() => go('/explore')}>
        <span className="ic">🧭</span><span>{t('nav.explore')}</span>
      </button>
      <button className="fab" onClick={() => { feedback('tap'); navigate('/now'); }} aria-label="Tipper Now">＋</button>
      <button ref={(e) => (refs.current.boite = e)} className={`n ${activeKey === 'boite' ? 'active' : ''}`} onClick={() => go('/messages')}>
        {(unreadMsg + unreadNotif) > 0 && <span className="nb">{Math.min(9, unreadMsg + unreadNotif)}</span>}
        <span className="ic">💬</span><span>{t('nav.inbox')}</span>
      </button>
      <button ref={(e) => (refs.current.profil = e)} className={`n ${activeKey === 'profil' ? 'active' : ''}`} onClick={() => go('/profile')}>
        <span className="ic">👤</span><span>{t('nav.profile')}</span>
      </button>
    </nav>
  );
}

export function HeaderMenu() {
  const navigate = useNavigate();
  const { user, t, openOnboarding } = useApp();
  const [open, setOpen] = useState(false);
  const items = [
    { ic: '⚡', label: t('menu.now'), to: '/now' },
    { ic: '📣', label: t('home.publish'), to: '/categories' },
    { ic: '🧭', label: t('nav.explore'), to: '/explore' },
    { ic: '🗺️', label: t('home.map'), to: '/map' },
    { ic: '👛', label: t('menu.wallet'), to: '/wallet' },
    { ic: '🏆', label: t('home.rank'), to: '/leaderboard' },
    { ic: '💬', label: t('nav.inbox'), to: '/messages' },
    { ic: user.verified ? '✅' : '🪪', label: t('menu.verify'), to: '/verify' },
    { ic: '👤', label: t('nav.profile'), to: '/profile' },
  ];
  if (user.is_admin) items.push({ ic: '🛠️', label: t('menu.admin'), to: '/admin' });
  return (
    <>
      <button className="iconbtn" onClick={() => setOpen(true)} aria-label={t('menu.title')}>☰</button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="header-menu fade-in">
            <div className="hm-title">{t('menu.title')}</div>
            {items.map((it) => (
              <button key={it.to} className="hm-item" onClick={() => { setOpen(false); navigate(it.to); }}>
                <span className="hm-ic">{it.ic}</span><span>{it.label}</span><span className="hm-arrow">›</span>
              </button>
            ))}
            <button className="hm-item" onClick={() => { setOpen(false); openOnboarding(); }}>
              <span className="hm-ic">💡</span><span>{t('ob.how')}</span><span className="hm-arrow">›</span>
            </button>
          </div>
        </>
      )}
    </>
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

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Avatar } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { Money, Tilt, SkeletonMission } from '../components/fx.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { coin } from '../constants.js';

export function Home() {
  const navigate = useNavigate();
  const { user, unreadNotif, captureLocation, showToast, theme, toggleTheme } = useApp();
  const [ads, setAds] = useState(null);
  const [wallet, setWallet] = useState(null);

  const load = useCallback(async () => {
    const [a, w] = await Promise.all([api.listAds({ sort: 'distance' }), api.wallet()]);
    setAds(a.ads); setWallet(w);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function locate() {
    try { await captureLocation(); showToast('Position mise à jour 📍'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  const lvl = user.level || { emoji: '🌱', name: 'Nouveau', progress: 0 };
  // Un seul flux : urgent/boost/instant d'abord, puis le reste
  const feed = (ads || []).filter((a) => !a.is_mine).slice(0, 5);

  return (
    <Screen>
      <AppBar
        brand
        subtitle={user.city ? `📍 ${user.city}` : 'Position non définie'}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="iconbtn" onClick={toggleTheme} title="Thème">{theme === 'light' ? '🌙' : '☀️'}</button>
            <button className="iconbtn" onClick={() => navigate('/notifications')}>🔔{unreadNotif > 0 && <span className="dot-badge">{unreadNotif}</span>}</button>
          </div>
        }
      />
      <div className="content">
        {/* Salutation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar user={user} size="m" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sub" style={{ fontSize: 13 }}>Bonjour,</div>
            <div className="display" style={{ fontWeight: 700, fontSize: 19 }}>{user.full_name.split(' ')[0]} 👋</div>
          </div>
          <button className="badge" onClick={() => navigate('/leaderboard')}>{lvl.emoji} {lvl.name}</button>
        </div>

        {/* Solde + niveau + note (une seule carte) */}
        <Tilt className="balance" onClick={() => navigate('/wallet')}>
          <div className="sheen" />
          <div className="lbl">Tipper Coins</div>
          <div className="amt"><Money value={wallet ? wallet.available : user.available} format={coin} /></div>
          <div className="bal-meta">
            <div className="bm-prog">
              <div style={{ fontSize: 12, opacity: 0.92 }}>{lvl.emoji} {lvl.name} · {user.xp} XP</div>
              <div className="bm-bar"><i style={{ width: `${Math.round((lvl.progress || 0) * 100)}%` }} /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⭐ {user.rating != null ? user.rating : 'Nouveau'}</div>
          </div>
        </Tilt>
        <div className="spacer" />

        {/* Action phare */}
        <motion.div className="now-hero" onClick={() => navigate('/now')} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}>
          <div className="nh-t">⚡ Tipper Now</div>
          <div className="nh-s">Un besoin tout de suite ? Décrivez-le, l'IA s'occupe du reste.</div>
          <div className="nh-go">✦ Demander avec l'IA →</div>
        </motion.div>

        {/* 2 grandes actions */}
        <div className="qa-grid">
          <motion.div className="action-tile" onClick={() => navigate('/explore')} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
            <div className="at-ic" style={{ background: 'rgba(54,224,160,0.16)' }}>🧭</div>
            <div className="at-t">Trouver une mission</div>
            <div className="at-s">Gagnez des pourboires</div>
          </motion.div>
          <motion.div className="action-tile" onClick={() => navigate('/categories')} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
            <div className="at-ic" style={{ background: 'rgba(255,122,69,0.16)' }}>📣</div>
            <div className="at-t">Publier une mission</div>
            <div className="at-s">Demandez un service</div>
          </motion.div>
        </div>
        <div className="spacer" />

        {/* Liens secondaires compacts */}
        <div className="mini-row">
          <button className="mini" onClick={() => navigate('/map')}>🗺️ Carte</button>
          <button className="mini" onClick={() => navigate('/leaderboard')}>🏆 Classement</button>
        </div>
        <div className="spacer" />

        {!user.lat && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Activez la géolocalisation</div>
              <div className="sub" style={{ fontSize: 12.5 }}>Pour voir les missions proches</div>
            </div>
            <button className="btn coral sm" onClick={locate}>Activer</button>
          </div>
        )}

        {/* Un seul flux */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
          <div className="h-sec" style={{ marginBottom: 0 }}>À proximité</div>
          <button className="muted" style={{ fontSize: 13, fontWeight: 700 }} onClick={() => navigate('/explore')}>Tout voir →</button>
        </div>
        {!ads ? <><SkeletonMission /><SkeletonMission /></>
          : feed.length === 0 ? <div className="card center muted">Aucune mission pour l'instant</div>
          : feed.map((a) => <Mission key={a.id} ad={a} />)}
      </div>
    </Screen>
  );
}

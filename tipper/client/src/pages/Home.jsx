import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Avatar } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { Money, Ring, Tilt, SkeletonMission } from '../components/fx.jsx';
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
  const urgent = (ads || []).filter((a) => a.urgent && !a.is_mine).slice(0, 3);
  const nearby = (ads || []).filter((a) => !a.is_mine).slice(0, 4);

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
      <div className="content stagger">
        {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar user={user} size="m" />
          <div style={{ flex: 1 }}>
            <div className="sub" style={{ fontSize: 13 }}>Bonsoir,</div>
            <div className="display" style={{ fontWeight: 700, fontSize: 19 }}>{user.full_name.split(' ')[0]} 👋</div>
          </div>
          <button className="badge" onClick={() => navigate('/profile')}>{lvl.emoji} {lvl.name}</button>
        </div>

        {/* Bento */}
        <div className="bento">
          <Tilt className="balance span2" onClick={() => navigate('/wallet')}>
            <div className="sheen" />
            <div className="lbl">Tipper Coins</div>
            <div className="amt"><Money value={wallet ? wallet.available : user.available} format={coin} /></div>
            {wallet && wallet.reserved > 0 && <div className="escrow">🔒 {coin(wallet.reserved)} en séquestre</div>}
          </Tilt>

          <div className="tile" onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Ring progress={lvl.progress} size={54}>{lvl.emoji}</Ring>
            <div>
              <div className="t-t">{lvl.name}</div>
              <div className="t-s">{user.xp} XP</div>
            </div>
          </div>

          <div className="tile" onClick={() => navigate('/profile')}>
            <div className="t-ic" style={{ background: 'rgba(255,194,75,0.16)' }}>⭐</div>
            <div className="t-t">{user.rating != null ? `${user.rating}/5` : 'Nouveau'}</div>
            <div className="t-s">{user.rating_count || 0} avis · confiance</div>
          </div>
        </div>
        <div className="spacer" />

        {/* Quick actions */}
        <div className="qa-grid">
          <div className="qa" onClick={() => navigate('/categories')}>
            <div className="qa-ic" style={{ background: 'rgba(255,122,69,0.16)' }}>📣</div>
            <div className="qa-t">Publier une mission</div>
            <div className="qa-s">Demandez un service</div>
          </div>
          <div className="qa" onClick={() => navigate('/explore')}>
            <div className="qa-ic" style={{ background: 'rgba(54,224,160,0.14)' }}>🧭</div>
            <div className="qa-t">Trouver une mission</div>
            <div className="qa-s">Gagnez des pourboires</div>
          </div>
          <div className="qa" onClick={() => navigate('/map')}>
            <div className="qa-ic" style={{ background: 'rgba(56,214,255,0.16)' }}>🗺️</div>
            <div className="qa-t">Carte</div>
            <div className="qa-s">Autour de vous</div>
          </div>
          <div className="qa" onClick={() => navigate('/leaderboard')}>
            <div className="qa-ic" style={{ background: 'rgba(255,194,75,0.16)' }}>🏆</div>
            <div className="qa-t">Classement</div>
            <div className="qa-s">Top helpers</div>
          </div>
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

        {urgent.length > 0 && (
          <>
            <div className="h-sec" style={{ marginTop: 6 }}>⚡ Urgent près de vous</div>
            {!ads ? <SkeletonMission /> : urgent.map((a) => <Mission key={a.id} ad={a} />)}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 12px' }}>
          <div className="h-sec" style={{ marginBottom: 0 }}>Missions récentes</div>
          <button className="muted" style={{ fontSize: 13, fontWeight: 700 }} onClick={() => navigate('/explore')}>Tout voir →</button>
        </div>
        {!ads ? <><SkeletonMission /><SkeletonMission /></> : nearby.map((a) => <Mission key={a.id} ad={a} />)}
      </div>
    </Screen>
  );
}

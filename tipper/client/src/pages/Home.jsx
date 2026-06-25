import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Avatar, Spinner } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { chf } from '../constants.js';

export function Home() {
  const navigate = useNavigate();
  const { user, unreadNotif, captureLocation, showToast } = useApp();
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
  const urgent = (ads || []).filter((a) => a.urgent && !a.is_mine).slice(0, 4);
  const nearby = (ads || []).filter((a) => !a.is_mine).slice(0, 4);

  return (
    <Screen>
      <AppBar
        brand
        subtitle={user.city ? `📍 ${user.city}` : 'Position non définie'}
        right={
          <button className="iconbtn" onClick={() => navigate('/notifications')}>
            🔔{unreadNotif > 0 && <span className="dot-badge">{unreadNotif}</span>}
          </button>
        }
      />
      <div className="content">
        {/* Greeting + level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar user={user} size="m" />
          <div style={{ flex: 1 }}>
            <div className="sub" style={{ fontSize: 13 }}>Bonjour,</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{user.full_name.split(' ')[0]}</div>
          </div>
          <button className="badge" onClick={() => navigate('/profile')}>{lvl.emoji} {lvl.name}</button>
        </div>

        {/* Balance */}
        <div className="balance" onClick={() => navigate('/wallet')}>
          <div className="lbl">Solde disponible</div>
          <div className="amt">{chf(wallet ? wallet.available : user.available)}</div>
          {wallet && wallet.reserved > 0 && <div className="escrow">🔒 {chf(wallet.reserved)} en séquestre</div>}
        </div>
        <div className="spacer" />

        {/* Quick actions */}
        <div className="qa-grid">
          <div className="qa" onClick={() => navigate('/categories')}>
            <div className="qa-ic" style={{ background: '#ffe9e3' }}>📣</div>
            <div className="qa-t">Publier une mission</div>
            <div className="qa-s">Demandez un service</div>
          </div>
          <div className="qa" onClick={() => navigate('/explore')}>
            <div className="qa-ic" style={{ background: '#e4f7f3' }}>🧭</div>
            <div className="qa-t">Trouver une mission</div>
            <div className="qa-s">Gagnez des pourboires</div>
          </div>
          <div className="qa" onClick={() => navigate('/map')}>
            <div className="qa-ic" style={{ background: '#e7eeff' }}>🗺️</div>
            <div className="qa-t">Carte</div>
            <div className="qa-s">Missions autour de vous</div>
          </div>
          <div className="qa" onClick={() => navigate('/leaderboard')}>
            <div className="qa-ic" style={{ background: '#fff1d9' }}>🏆</div>
            <div className="qa-t">Classement</div>
            <div className="qa-s">Top helpers</div>
          </div>
        </div>
        <div className="spacer" />

        {!user.lat && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fffaf8', borderColor: '#ffe1d8' }}>
            <span style={{ fontSize: 24 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Activez la géolocalisation</div>
              <div className="sub" style={{ fontSize: 12.5 }}>Pour voir les missions les plus proches</div>
            </div>
            <button className="btn coral sm" onClick={locate}>Activer</button>
          </div>
        )}

        {/* Urgent */}
        {urgent.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="h-sec" style={{ marginBottom: 0 }}>⚡ Urgent près de vous</div>
            </div>
            {!ads ? <Spinner /> : urgent.map((a) => <Mission key={a.id} ad={a} />)}
          </>
        )}

        {/* Nearby */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
          <div className="h-sec" style={{ marginBottom: 0 }}>Missions récentes</div>
          <button className="muted" style={{ fontSize: 13, fontWeight: 700 }} onClick={() => navigate('/explore')}>Tout voir →</button>
        </div>
        {!ads ? <Spinner /> : nearby.map((a) => <Mission key={a.id} ad={a} />)}
      </div>
    </Screen>
  );
}

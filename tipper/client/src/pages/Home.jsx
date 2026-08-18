import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Avatar, HeaderMenu } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { GettingStarted } from '../components/GettingStarted.jsx';
import { TwoChoices, GeoPrompt, CoinExplainer } from '../components/Explain.jsx';
import { SkeletonMission } from '../components/fx.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { coin } from '../constants.js';

// Accueil — répond à une seule question : « que puis-je faire maintenant ? »
// Hiérarchie : 1) les deux actions principales · 2) mon activité et les demandes
// proches · 3) mon solde · 4) les fonctionnalités avancées, regroupées et
// expliquées, sans concurrencer le parcours principal.
export function Home() {
  const navigate = useNavigate();
  const { user, unreadNotif, captureLocation, showToast, theme, toggleTheme, t } = useApp();
  const [ads, setAds] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [mine, setMine] = useState([]);
  const [myProps, setMyProps] = useState([]);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoHidden, setGeoHidden] = useState(false);

  const load = useCallback(async () => {
    const [a, w, m, p] = await Promise.all([
      api.listAds({ sort: 'distance' }),
      api.wallet(),
      api.listAds({ mine: '1' }),
      api.myApplications().catch(() => ({ applications: [] })),
    ]);
    setAds(a.ads); setWallet(w); setMine(m.ads || []); setMyProps(p.applications || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function locate() {
    setGeoBusy(true);
    try { await captureLocation(); showToast(t('ux.geo.ok')); load(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setGeoBusy(false); }
  }

  // Demandes des autres, les plus proches d'abord
  const nearby = (ads || []).filter((a) => !a.is_mine).slice(0, 4);
  const openMine = mine.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;
  const openProps = myProps.filter((a) => ['pending', 'accepted', 'delivered'].includes(a.status)).length;

  // Fonctionnalités avancées : nommées par ce qu'elles font, pas par leur nom produit
  const more = [
    { ic: '⚡', t: t('ux.f.now'), d: t('ux.f.now.d'), to: '/now' },
    { ic: '🗺️', t: t('ux.f.map'), to: '/map' },
    { ic: '🪪', t: t('ux.f.verify'), d: t('ux.f.verify.d'), to: '/verify', hide: user.verified },
    { ic: '🏆', t: t('ux.f.rank'), to: '/leaderboard' },
    { ic: '💎', t: t('ux.f.pro'), to: '/wallet', hide: user.pro },
  ].filter((m) => !m.hide);

  return (
    <Screen>
      <AppBar
        brand
        subtitle={user.city ? `📍 ${user.city}` : null}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="iconbtn" onClick={toggleTheme} title="Thème">{theme === 'light' ? '🌙' : '☀️'}</button>
            <button className="iconbtn" onClick={() => navigate('/notifications')}>🔔{unreadNotif > 0 && <span className="dot-badge">{unreadNotif}</span>}</button>
            <HeaderMenu />
          </div>
        }
      />
      <div className="content stagger">
        {/* Salutation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Avatar user={user} size="m" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sub" style={{ fontSize: 13 }}>{t('home.hello')}</div>
            <div className="display" style={{ fontWeight: 700, fontSize: 19 }}>{user.full_name.split(' ')[0]} 👋</div>
          </div>
        </div>

        {/* ── PRIORITÉ 1 — les deux actions principales ── */}
        <div className="h-sec">{t('ux.home.what')}</div>
        <TwoChoices />
        <div className="spacer" />

        {/* Checklist de démarrage (disparaît une fois complétée) */}
        <GettingStarted
          posted={mine.length > 0}
          onLocate={locate}
          onVerify={() => navigate('/verify')}
          onPost={() => navigate('/categories')}
        />

        {/* Position : on explique avant de demander la permission */}
        {!user.lat && !geoHidden && (
          <GeoPrompt onAllow={locate} onLater={() => setGeoHidden(true)} busy={geoBusy} />
        )}

        {/* ── PRIORITÉ 2 — mon activité ── */}
        {(openMine > 0 || openProps > 0) && (
          <>
            <div className="h-sec">{t('ux.home.activity')}</div>
            <div className="bento" style={{ marginBottom: 18 }}>
              <div className="tile" onClick={() => navigate('/profile')}>
                <div className="t-ic" style={{ background: 'rgba(255,122,69,0.16)' }}>🙋</div>
                <div className="t-t">{t('ux.home.mine')}</div>
                <div className="t-s">{openMine > 0 ? `${openMine} ${t('ux.home.ongoing')}` : t('ux.none')}</div>
              </div>
              <div className="tile" onClick={() => navigate('/profile')}>
                <div className="t-ic" style={{ background: 'rgba(54,224,160,0.14)' }}>🤝</div>
                <div className="t-t">{t('ux.home.myoffers')}</div>
                <div className="t-s">{openProps > 0 ? `${openProps} ${t('ux.home.ongoing')}` : t('ux.none')}</div>
              </div>
            </div>
          </>
        )}

        {/* Demandes proches — le cœur du « je veux aider » */}
        {!ads && <><SkeletonMission /><SkeletonMission /></>}
        {nearby.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
              <div className="h-sec" style={{ marginBottom: 0 }}>{t('ux.home.near')}</div>
              <button className="muted" style={{ fontSize: 13, fontWeight: 700 }} onClick={() => navigate('/explore')}>{t('home.seeall')}</button>
            </div>
            {nearby.map((a) => <Mission key={a.id} ad={a} />)}
            <div className="spacer" />
          </>
        )}

        {/* ── PRIORITÉ 3 — solde, avec la valeur d'un Coin toujours visible ── */}
        <div className="h-sec">{t('ux.home.balance')}</div>
        <div className="balance" onClick={() => navigate('/wallet')} style={{ marginBottom: 6 }}>
          <div className="sheen" />
          <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {t('ux.available')} <CoinExplainer compact />
          </div>
          <div className="amt">{coin(wallet ? wallet.available : user.available)}</div>
          {wallet && wallet.reserved > 0 && (
            <div className="escrow">🔒 {coin(wallet.reserved)} · {t('ux.reserved').toLowerCase()}</div>
          )}
        </div>
        <div className="spacer" />

        {/* ── PRIORITÉ 4 — fonctionnalités avancées, groupées et expliquées ── */}
        <div className="h-sec">{t('ux.home.more')}</div>
        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="more-list">
            {more.map((m) => (
              <button key={m.to + m.t} className="more-row" onClick={() => navigate(m.to)}>
                <span className="m-ic">{m.ic}</span>
                <span className="m-tx">
                  <span className="m-t" style={{ display: 'block' }}>{m.t}</span>
                  {m.d && <span className="m-d" style={{ display: 'block' }}>{m.d}</span>}
                </span>
                <span className="m-go">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty, Avatar, Stars } from '../components/Layout.jsx';
import { Money, Ring } from '../components/fx.jsx';
import { Mission } from '../components/AdCard.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, chf, STATUS_LABEL, timeAgo } from '../constants.js';
import { enablePush, pushStatus } from '../push.js';

export function Profile() {
  const { user, setUser, logout, showToast, captureLocation, theme, toggleTheme, soundOn, toggleSound, hapticOn, toggleHaptic } = useApp();
  const [tab, setTab] = useState('missions');
  const [myAds, setMyAds] = useState(null);
  const [myApps, setMyApps] = useState(null);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listAds({ mine: '1' }).then((d) => setMyAds(d.ads));
    api.myApplications().then((d) => setMyApps(d.applications));
    api.getUser(user.id).then(setMe);
  }, [user.id]);

  const [name, setName] = useState(user.full_name);
  const [bio, setBio] = useState(user.bio || '');

  async function saveProfile() {
    try { const { user: u } = await api.updateProfile({ full_name: name, bio }); setUser(u); showToast('Profil mis à jour'); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function locate() {
    try { await captureLocation(); showToast('Position enregistrée 📍'); } catch (e) { showToast(e.message, 'error'); }
  }
  async function activatePush() {
    try { await enablePush(); showToast('Notifications activées 🔔'); } catch (e) { showToast(e.message, 'error'); }
  }

  const lvl = user.level || { emoji: '🌱', name: 'Nouveau', progress: 0, next: { min: 100 }, xp: 0 };

  return (
    <Screen>
      <AppBar title="Profil" back="/"
        right={<button className="iconbtn" onClick={logout} title="Déconnexion">⏻</button>} />
      <div className="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar user={user} size="l" glow />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', gap: 6 }}>{user.full_name} {user.verified && '✅'}</div>
            <Stars value={user.rating} count={user.rating_count} />
            <div className="sub" style={{ fontSize: 13, marginTop: 2 }}>{user.city || 'Position non définie'}</div>
          </div>
        </div>

        {/* Niveau */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring progress={lvl.progress} size={68} stroke={7}>{lvl.emoji}</Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Niveau {lvl.name}</div>
            <div className="sub" style={{ fontSize: 13, marginBottom: 8 }}>{lvl.xp} XP{lvl.next ? ` / ${lvl.next.min}` : ''}</div>
            {user.badges?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {user.badges.map((b) => <span key={b.key} className="badge">{b.emoji} {b.label}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 14 }}>
          <div className="stat"><div className="v">{me ? me.stats.ads : '—'}</div><div className="k">Missions</div></div>
          <div className="stat"><div className="v">{me ? me.stats.completed : '—'}</div><div className="k">Services rendus</div></div>
          <div className="stat"><div className="v" style={{ color: 'var(--teal)' }}>{me ? Math.round(me.stats.earned) : '—'}</div><div className="k">Gagné 🪙</div></div>
        </div>

        <div className="balance" onClick={() => navigate('/wallet')} style={{ marginBottom: 14 }}>
          <div className="sheen" />
          <div className="lbl">Tipper Coins</div>
          <div className="amt" style={{ fontSize: 30 }}><Money value={user.available} format={coin} /></div>
          {user.points > 0 && <div className="escrow">🎯 {user.points} Tipper Points</div>}
        </div>

        <div className="pill-row" style={{ marginBottom: 6 }}>
          <button className={`pill ${tab === 'missions' ? 'active' : ''}`} onClick={() => setTab('missions')}>Mes missions</button>
          <button className={`pill ${tab === 'apps' ? 'active' : ''}`} onClick={() => setTab('apps')}>Candidatures</button>
          <button className={`pill ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Avis</button>
          <button className={`pill ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Réglages</button>
        </div>

        {tab === 'missions' && (!myAds ? <Spinner /> : myAds.length === 0 ? <Empty icon="📭" title="Aucune mission" hint="Publiez votre première demande"
          action={<button className="btn coral sm" onClick={() => navigate('/categories')}>Publier</button>} /> : myAds.map((a) => <Mission key={a.id} ad={a} />))}

        {tab === 'apps' && (!myApps ? <Spinner /> : myApps.length === 0 ? <Empty icon="🗂️" title="Aucune candidature" /> : (
          <div className="card">
            {myApps.map((a) => (
              <div key={a.id} className="row" onClick={() => navigate(`/ads/${a.ad_id}`)}>
                <div className="av m" style={{ background: 'var(--line-soft)', color: 'var(--ink)' }}>{a.photo ? <img src={a.photo} alt="" /> : '📌'}</div>
                <div className="grow"><div className="r-name">{a.ad_title}</div><div className="r-sub">Pourboire {coin(a.tip_amount)} · {timeAgo(a.created_at)}</div></div>
                <span className={`status ${a.status}`}>{STATUS_LABEL[a.status]}</span>
              </div>
            ))}
          </div>
        ))}

        {tab === 'reviews' && (!me ? <Spinner /> : me.reviews.length === 0 ? <Empty icon="⭐" title="Aucun avis" hint="Rendez des services pour en recevoir" /> : (
          <div className="card">
            {me.reviews.map((r) => (
              <div key={r.id} className="row">
                <Avatar user={r.rater} size="s" />
                <div className="grow"><div className="r-name" style={{ fontSize: 14 }}>{r.rater.full_name}</div><div className="r-sub" style={{ whiteSpace: 'normal' }}>{r.comment || '—'}</div></div>
                <Stars value={r.stars} />
              </div>
            ))}
          </div>
        ))}

        {tab === 'settings' && (
          <div className="card">
            <div className="switch-row" onClick={toggleTheme}>
              <div><div style={{ fontWeight: 700 }}>{theme === 'light' ? '☀️ Thème clair' : '🌙 Thème sombre'}</div><div className="sub" style={{ fontSize: 12.5 }}>Apparence de l'app</div></div>
              <div className={`switch ${theme === 'dark' ? 'on' : ''}`}><i /></div>
            </div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div className="switch-row" onClick={toggleSound}>
              <div><div style={{ fontWeight: 700 }}>🔊 Sons</div><div className="sub" style={{ fontSize: 12.5 }}>Retours sonores au toucher</div></div>
              <div className={`switch ${soundOn ? 'on' : ''}`}><i /></div>
            </div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div className="switch-row" onClick={toggleHaptic}>
              <div><div style={{ fontWeight: 700 }}>📳 Vibrations</div><div className="sub" style={{ fontSize: 12.5 }}>Retour haptique (mobile)</div></div>
              <div className={`switch ${hapticOn ? 'on' : ''}`}><i /></div>
            </div>
            <div className="divider" />
            <div className="field"><label>Nom complet</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Quelques mots sur vous…" /></div>
            <button className="btn coral" onClick={saveProfile}>Enregistrer</button>
            <div className="divider" />
            <button className="btn ghost" onClick={locate}>📍 {user.lat ? `Position : ${user.city || 'enregistrée'}` : 'Activer la géolocalisation'}</button>
            <div className="spacer" />
            {pushStatus() !== 'granted' && <><button className="btn ghost" onClick={activatePush}>🔔 Activer les notifications</button><div className="spacer" /></>}
            <button className="btn danger" onClick={logout}>Se déconnecter</button>
          </div>
        )}
      </div>
    </Screen>
  );
}

export function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, showToast } = useApp();
  const [data, setData] = useState(null);
  useEffect(() => { api.getUser(id).then(setData).catch((e) => showToast(e.message, 'error')); }, [id, showToast]);
  if (!data) return <Screen nav={false}><AppBar title="" back={-1} /><Spinner /></Screen>;
  const u = data.user;
  const lvl = u.level || {};
  return (
    <Screen nav={false}>
      <AppBar title="Profil" back={-1} />
      <div className="content">
        <div className="center">
          <div style={{ display: 'inline-block' }}><Avatar user={u} size="l" glow /></div>
          <div style={{ fontWeight: 800, fontSize: 21, marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>{u.full_name} {u.verified && '✅'}</div>
          <div style={{ marginTop: 4 }}><Stars value={u.rating} count={u.rating_count} size={15} /></div>
          <div className="sub" style={{ marginTop: 2 }}>{lvl.emoji} {lvl.name} · {u.city || '—'}</div>
        </div>
        {u.bio && <div className="card center" style={{ marginTop: 14 }}>{u.bio}</div>}
        {u.badges?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '14px 0' }}>
            {u.badges.map((b) => <span key={b.key} className="badge">{b.emoji} {b.label}</span>)}
          </div>
        )}
        <div className="stat-grid">
          <div className="stat"><div className="v">{data.stats.ads}</div><div className="k">Missions</div></div>
          <div className="stat"><div className="v">{data.stats.completed}</div><div className="k">Rendus</div></div>
          <div className="stat"><div className="v">{u.rating_count}</div><div className="k">Avis</div></div>
        </div>
        {me.id !== u.id && <><div className="spacer" /><button className="btn coral" onClick={() => navigate(`/messages/${u.id}`)}>💬 Envoyer un message</button></>}

        {data.reviews.length > 0 && (
          <>
            <div className="h-sec" style={{ marginTop: 18 }}>Avis reçus</div>
            <div className="card">
              {data.reviews.map((r) => (
                <div key={r.id} className="row">
                  <Avatar user={r.rater} size="s" />
                  <div className="grow"><div className="r-name" style={{ fontSize: 14 }}>{r.rater.full_name}</div><div className="r-sub" style={{ whiteSpace: 'normal' }}>{r.comment || '—'}</div></div>
                  <Stars value={r.stars} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [scope, setScope] = useState('global');
  const [data, setData] = useState(null);
  useEffect(() => { setData(null); api.leaderboard({ scope }).then(setData).catch((e) => showToast(e.message, 'error')); }, [scope, showToast]);

  return (
    <Screen>
      <AppBar title="Classement" back="/" subtitle={data?.me_rank ? `Vous êtes #${data.me_rank}` : ''} />
      <div className="content">
        <div className="pill-row" style={{ marginBottom: 12 }}>
          <button className={`pill ${scope === 'global' ? 'active' : ''}`} onClick={() => setScope('global')}>🌍 Global</button>
          <button className={`pill ${scope === 'city' ? 'active' : ''}`} onClick={() => setScope('city')}>📍 Ma ville</button>
        </div>
        {!data ? <Spinner /> : data.leaderboard.map((u) => (
          <div key={u.id} className={`lb-row ${u.is_me ? 'me' : ''}`} onClick={() => navigate(`/u/${u.id}`)}>
            <div className={`lb-rank ${u.rank <= 3 ? 'top' : ''}`}>{u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : u.rank}</div>
            <Avatar user={u} size="s" />
            <div className="grow"><div className="r-name" style={{ fontSize: 14 }}>{u.full_name}{u.is_me ? ' (vous)' : ''}</div><div className="r-sub">{u.level.emoji} {u.level.name}</div></div>
            <div style={{ fontWeight: 800, color: 'var(--coral)' }}>{u.xp} XP</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

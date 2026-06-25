import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, Header, Spinner, Empty } from '../components/Layout.jsx';
import { AdCard } from '../components/AdCard.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { chf, initials, catLabel, STATUS_LABEL, timeAgo } from '../constants.js';
import { enablePush, pushStatus } from '../push.js';

export function Profile() {
  const { user, setUser, logout, showToast, captureLocation } = useApp();
  const [tab, setTab] = useState('ads');
  const [myAds, setMyAds] = useState(null);
  const [myApps, setMyApps] = useState(null);
  const navigate = useNavigate();

  const loadAds = useCallback(() => api.listAds({ mine: '1' }).then((d) => setMyAds(d.ads)), []);
  const loadApps = useCallback(() => api.myApplications().then((d) => setMyApps(d.applications)), []);
  useEffect(() => { loadAds(); loadApps(); }, [loadAds, loadApps]);

  const [name, setName] = useState(user.full_name);
  const [bio, setBio] = useState(user.bio || '');

  async function saveProfile() {
    try { const { user: u } = await api.updateProfile({ full_name: name, bio }); setUser(u); showToast('Profil mis à jour'); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function locate() {
    try { await captureLocation(); showToast('Position enregistrée 📍'); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function activatePush() {
    try { await enablePush(); showToast('Notifications activées 🔔'); }
    catch (e) { showToast(e.message, 'error'); }
  }

  return (
    <Screen>
      <Header title="TIPPER" back="/" right={<button className="icon-btn" onClick={logout} title="Déconnexion">⏻</button>} />
      <div className="content">
        <div className="avatar-lg">{initials(user.full_name)}</div>
        <h1 className="page-title center" style={{ marginBottom: 2 }}>{user.full_name}</h1>
        <p className="center muted" style={{ marginTop: 0 }}>{user.email}</p>
        <div className="wallet-hero" style={{ marginTop: 12 }}>
          <div className="label">Solde wallet</div>
          <div className="amount" style={{ fontSize: 30 }}>{chf(user.wallet_balance)}</div>
          <button className="btn ghost" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }} onClick={() => navigate('/wallet')}>Gérer mon wallet</button>
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '6px 0 14px' }}>
          <button className={`btn sm ${tab === 'ads' ? '' : 'ghost'}`} onClick={() => setTab('ads')}>Mes annonces</button>
          <button className={`btn sm ${tab === 'apps' ? '' : 'ghost'}`} onClick={() => setTab('apps')}>Candidatures</button>
          <button className={`btn sm ${tab === 'settings' ? '' : 'ghost'}`} onClick={() => setTab('settings')}>Réglages</button>
        </div>

        {tab === 'ads' && (!myAds ? <Spinner /> : myAds.length === 0 ? <Empty icon="📭" title="Aucune annonce" hint="Postez votre première demande !" /> :
          <div className="feed-grid">{myAds.map((a) => <AdCard key={a.id} ad={a} />)}</div>
        )}

        {tab === 'apps' && (!myApps ? <Spinner /> : myApps.length === 0 ? <Empty icon="🗂️" title="Aucune candidature" /> :
          myApps.map((a) => (
            <div key={a.id} className="list-row" onClick={() => navigate(`/ads/${a.ad_id}`)} style={{ cursor: 'pointer' }}>
              <div className="avatar">{a.photo ? <img src={a.photo} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '📌'}</div>
              <div className="grow">
                <div className="name">{a.ad_title}</div>
                <div className="sub">Pourboire {chf(a.tip_amount)} · {timeAgo(a.created_at)}</div>
              </div>
              <span className={`status ${a.status}`}>{STATUS_LABEL[a.status]}</span>
            </div>
          ))
        )}

        {tab === 'settings' && (
          <div className="card">
            <div className="field"><label>Nom complet</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Quelques mots sur vous…" /></div>
            <button className="btn" onClick={saveProfile}>Enregistrer</button>
            <div className="spacer" />
            <button className="btn ghost" onClick={locate}>📍 {user.lat ? `Position : ${user.city || 'enregistrée'}` : 'Activer la géolocalisation'}</button>
            <div className="spacer" />
            {pushStatus() !== 'granted' && <button className="btn ghost" onClick={activatePush}>🔔 Activer les notifications push</button>}
            <div className="spacer" />
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
  const { showToast } = useApp();
  const [data, setData] = useState(null);
  useEffect(() => { api.getUser(id).then(setData).catch((e) => showToast(e.message, 'error')); }, [id, showToast]);
  if (!data) return <Screen><Header title="TIPPER" /><Spinner /></Screen>;
  return (
    <Screen>
      <Header title="TIPPER" />
      <div className="content">
        <div className="avatar-lg">{initials(data.user.full_name)}</div>
        <h1 className="page-title center" style={{ marginBottom: 2 }}>{data.user.full_name}</h1>
        <p className="center muted">{data.user.city || ''}</p>
        {data.user.bio && <div className="card center">{data.user.bio}</div>}
        <div className="card">
          <div className="tx-row"><span className="muted">Annonces publiées</span><strong>{data.stats.ads}</strong></div>
          <div className="tx-row"><span className="muted">Services rendus</span><strong>{data.stats.tips_received}</strong></div>
          <div className="tx-row"><span className="muted">Membre depuis</span><span>{timeAgo(data.user.created_at)}</span></div>
        </div>
        <button className="btn magenta" onClick={() => navigate(`/messages/${data.user.id}`)}>💬 Envoyer un message</button>
      </div>
    </Screen>
  );
}

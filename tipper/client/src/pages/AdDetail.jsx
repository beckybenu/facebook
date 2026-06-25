import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, Header, Spinner } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { chf, catLabel, catIcon, STATUS_LABEL, initials, timeAgo } from '../constants.js';

export function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, refreshBadges } = useApp();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const { ad } = await api.getAd(id); setAd(ad); }
    catch (e) { showToast(e.message, 'error'); navigate('/feed'); }
    finally { setLoading(false); }
  }, [id, showToast, navigate]);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setBusy(true);
    try {
      await api.apply(id, message);
      showToast('Candidature envoyée ! 🙌');
      setMessage('');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  async function decide(appId, action) {
    try { await api.decide(appId, action); showToast(action === 'accept' ? 'Candidat accepté ✅' : 'Candidature refusée'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  async function complete(appId) {
    if (!confirm('Confirmer la prestation et verser le pourboire ?')) return;
    try {
      await api.completeAd(id, appId);
      const { user } = await api.me(); setUser(user);
      showToast('Pourboire versé 💰');
      refreshBadges();
      load();
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function cancel() {
    if (!confirm('Annuler cette annonce ?')) return;
    try { await api.cancelAd(id); showToast('Annonce annulée'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  if (loading) return <Screen><Header title="TIPPER" back="/feed" /><Spinner /></Screen>;
  if (!ad) return null;

  const mine = ad.is_mine;
  const myApp = ad.my_application;
  const closed = ad.status === 'completed' || ad.status === 'cancelled';

  return (
    <Screen>
      <Header title={catLabel(ad.category)} back="/feed" />
      <div className="content">
        {ad.photo
          ? <img src={ad.photo} alt={ad.title} style={{ width: '100%', borderRadius: 14, marginBottom: 14, aspectRatio: '16/10', objectFit: 'cover' }} />
          : <div className="photo-upload" style={{ marginBottom: 14, cursor: 'default', color: 'var(--indigo-light)', fontSize: 48 }}>{catIcon(ad.category)}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="chip-cat">{catLabel(ad.category)}</span>
          <span className={`status ${ad.status}`}>{STATUS_LABEL[ad.status]}</span>
        </div>
        <h1 className="page-title" style={{ marginTop: 10 }}>{ad.title}</h1>

        <div className="card">
          {ad.price != null && <div className="tx-row"><span className="muted">Prix / budget</span><strong>{chf(ad.price)}</strong></div>}
          <div className="tx-row"><span className="muted">Pourboire offert</span><strong style={{ color: 'var(--magenta)' }}>{chf(ad.tip_amount)}</strong></div>
          <div className="tx-row"><span className="muted">Places restantes</span><strong>{ad.spots_left} / {ad.max_participants}</strong></div>
          {ad.distance_km != null && <div className="tx-row"><span className="muted">Distance</span><strong>{ad.distance_km} km</strong></div>}
          <div className="tx-row"><span className="muted">Publiée</span><span>{timeAgo(ad.created_at)}</span></div>
        </div>

        {ad.description && <div className="card"><div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Description</div>{ad.description}</div>}

        {/* Auteur */}
        <div className="list-row" onClick={() => navigate(`/u/${ad.author.id}`)} style={{ cursor: 'pointer' }}>
          <div className="avatar">{initials(ad.author.full_name)}</div>
          <div className="grow">
            <div className="name">{ad.author.full_name}</div>
            <div className="sub">{ad.city || ad.author.city || 'Localisation non précisée'}</div>
          </div>
          {!mine && <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); navigate(`/messages/${ad.author.id}`); }}>💬 Message</button>}
        </div>

        <div className="spacer" />

        {/* Actions pour le candidat */}
        {!mine && !closed && (
          myApp ? (
            <div className="card center">
              <div className="big" style={{ fontSize: 38 }}>{myApp.status === 'accepted' ? '✅' : myApp.status === 'rejected' ? '❌' : myApp.status === 'completed' ? '💰' : '⏳'}</div>
              <strong>Candidature {STATUS_LABEL[myApp.status]?.toLowerCase()}</strong>
              <p className="muted" style={{ fontSize: 13 }}>
                {myApp.status === 'pending' && "En attente de la réponse de l'auteur."}
                {myApp.status === 'accepted' && 'Réalisez la prestation, le pourboire sera versé à la fin.'}
                {myApp.status === 'completed' && 'Prestation terminée, pourboire reçu !'}
                {myApp.status === 'rejected' && "Cette candidature n'a pas été retenue."}
              </p>
            </div>
          ) : ad.spots_left > 0 ? (
            <>
              <div className="field">
                <label>Votre message (optionnel)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je peux vous aider…" />
              </div>
              <button className="btn magenta" disabled={busy} onClick={apply}>{busy ? '…' : 'POSTULER'}</button>
            </>
          ) : (
            <div className="card center muted">Complet — maximum {ad.max_participants} participants atteint.</div>
          )
        )}

        {/* Gestion par l'auteur */}
        {mine && (
          <>
            <h2 style={{ fontSize: 18, margin: '4px 0 10px' }}>Candidatures ({ad.applications?.length || 0})</h2>
            {(!ad.applications || ad.applications.length === 0) && <div className="card muted center">Aucune candidature pour le moment.</div>}
            {ad.applications?.map((a) => (
              <div key={a.id} className="card">
                <div className="list-row" style={{ borderBottom: 'none', paddingBottom: 6 }}>
                  <div className="avatar">{initials(a.applicant.full_name)}</div>
                  <div className="grow">
                    <div className="name">{a.applicant.full_name}</div>
                    <div className="sub">{timeAgo(a.created_at)}</div>
                  </div>
                  <span className={`status ${a.status}`}>{STATUS_LABEL[a.status]}</span>
                </div>
                {a.message && <p style={{ fontSize: 14, margin: '4px 0 10px' }}>« {a.message} »</p>}
                <div className="btn-row">
                  <button className="btn sm ghost" style={{ flex: 1 }} onClick={() => navigate(`/messages/${a.applicant.id}`)}>💬</button>
                  {a.status === 'pending' && !closed && <>
                    <button className="btn sm danger" style={{ flex: 1 }} onClick={() => decide(a.id, 'reject')}>Refuser</button>
                    <button className="btn sm ok" style={{ flex: 1 }} onClick={() => decide(a.id, 'accept')}>Accepter</button>
                  </>}
                  {a.status === 'accepted' && <button className="btn sm magenta" style={{ flex: 2 }} onClick={() => complete(a.id)}>Verser le pourboire 💰</button>}
                </div>
              </div>
            ))}
            {!closed && <button className="btn ghost danger" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={cancel}>Annuler l'annonce</button>}
          </>
        )}
        <div className="spacer" />
      </div>
    </Screen>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Avatar, Stars, Sheet } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, chf, catLabel, catIcon, catTint, STATUS_LABEL, dateShort } from '../constants.js';

const CHATTABLE = ['accepted', 'delivered', 'completed'];

const STEPS = [
  { key: 'open', cap: 'Ouverte', i: 0 },
  { key: 'in_progress', cap: 'Acceptée', i: 1 },
  { key: 'delivered', cap: 'Livrée', i: 2 },
  { key: 'completed', cap: 'Terminée', i: 3 },
];
const stepIndex = { open: 0, in_progress: 1, delivered: 2, completed: 3, cancelled: 0 };

function Stepper({ status }) {
  const cur = stepIndex[status] ?? 0;
  return (
    <div className="stepper">
      {STEPS.map((s) => (
        <div key={s.key} className={`st ${s.i < cur ? 'done' : s.i === cur ? 'active' : ''}`}>
          <div className="bar" />
          <div className="ring">{s.i < cur ? '✓' : s.i + 1}</div>
          <div className="cap">{s.cap}</div>
        </div>
      ))}
    </div>
  );
}

function RatingSheet({ onClose, onSubmit, title }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Sheet onClose={onClose}>
      <div className="h-sec center">{title}</div>
      <div className="star-pick" style={{ margin: '12px 0 18px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</span>
        ))}
      </div>
      <div className="field">
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre commentaire (optionnel)…" />
      </div>
      <button className="btn coral" disabled={busy} onClick={async () => { setBusy(true); await onSubmit(stars, comment); setBusy(false); }}>
        Publier l'avis
      </button>
    </Sheet>
  );
}

export function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, refreshBadges } = useApp();
  const [ad, setAd] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(null); // { rateeId, role, title }

  const load = useCallback(async () => {
    try { const { ad } = await api.getAd(id); setAd(ad); }
    catch (e) { showToast(e.message, 'error'); navigate('/explore'); }
  }, [id, showToast, navigate]);
  useEffect(() => { load(); }, [load]);

  const refreshMe = async () => { try { const { user } = await api.me(); setUser(user); } catch { /* ignore */ } };

  async function apply() {
    setBusy(true);
    try { await api.apply(id, message); showToast('Candidature envoyée ! 🙌'); setMessage(''); load(); }
    catch (e) { showToast(e.message, 'error'); } finally { setBusy(false); }
  }
  async function decide(appId, action) {
    try { await api.decide(appId, action); showToast(action === 'accept' ? 'Helper accepté ✅' : 'Refusé'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function deliver(appId) {
    try { await api.markDelivered(id, appId); showToast('Marqué comme livré 📦'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function confirm(appId) {
    if (!confirm('Confirmer la prestation et libérer le pourboire ?')) return;
    try { await api.confirmCompletion(id, appId); await refreshMe(); refreshBadges(); showToast('Pourboire libéré 💰'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function cancelAd() {
    if (!confirm('Annuler cette mission ? Le pourboire vous sera remboursé.')) return;
    try { await api.cancelAd(id); await refreshMe(); showToast('Mission annulée, escrow remboursé'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function openDispute() {
    const reason = prompt('Décrivez le problème rencontré :');
    if (!reason) return;
    try { await api.dispute(id, reason); showToast('Litige envoyé, notre équipe va regarder ⚠️'); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function submitRating(stars, comment) {
    try {
      await api.rate({ ad_id: id, ratee_id: rating.rateeId, role: rating.role, stars, comment });
      setRating(null); showToast('Merci pour votre avis ⭐'); load();
    } catch (e) { showToast(e.message, 'error'); }
  }

  if (!ad) return <Screen nav={false}><AppBar title="" back="/explore" /><Spinner /></Screen>;

  const mine = ad.is_mine;
  const myApp = ad.my_application;
  const closed = ad.status === 'completed' || ad.status === 'cancelled';
  const myReviewExists = (rateeId) => ad.reviews?.some((r) => r.rater_id === user.id && r.ratee_id === rateeId);

  return (
    <Screen nav={false}>
      <AppBar title={catLabel(ad.category)} back="/explore"
        right={<button className="iconbtn" onClick={async () => { await api.toggleSave(id); load(); }}>{ad.is_saved ? '♥' : '♡'}</button>} />
      <div className="content">
        {ad.photo
          ? <img src={ad.photo} alt="" style={{ width: '100%', borderRadius: 'var(--r-md)', marginBottom: 14, aspectRatio: '16/10', objectFit: 'cover' }} />
          : <div style={{ height: 150, borderRadius: 'var(--r-md)', marginBottom: 14, display: 'grid', placeItems: 'center', fontSize: 56, background: catTint(ad.category) + '22', color: catTint(ad.category) }}>{catIcon(ad.category)}</div>}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="tag cat">{catLabel(ad.category)}</span>
          {ad.urgent && <span className="tag urgent">⚡ Urgent</span>}
          <span className={`status ${ad.status}`} style={{ marginLeft: 'auto' }}>{STATUS_LABEL[ad.status]}</span>
        </div>
        <h1 className="h-page" style={{ marginBottom: 12 }}>{ad.title}</h1>

        {ad.status !== 'cancelled' && <div className="card"><Stepper status={ad.status} /></div>}

        <div className="card">
          <div className="tx" style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <div className="ic" style={{ background: '#e4f7f3' }}>💰</div>
            <div><div style={{ fontWeight: 800 }}>Pourboire</div><div className="sub" style={{ fontSize: 12 }}>Bloqué en séquestre · helper reçoit 90%</div></div>
            <div className="amt" style={{ color: 'var(--teal)', fontSize: 18 }}>{coin(ad.tip_amount)}</div>
          </div>
          {ad.price != null && <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>🏷️</div><div style={{ fontWeight: 700 }}>Prix du bien</div><div className="amt">{chf(ad.price)}</div></div>}
          <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>📍</div><div style={{ fontWeight: 700 }}>{ad.distance_km != null ? `${ad.distance_km} km` : (ad.city || '—')}</div><div className="amt" style={{ fontWeight: 600, color: 'var(--muted)' }}>{ad.spots_left}/{ad.max_participants} places</div></div>
          {ad.scheduled_at && <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>🗓️</div><div style={{ fontWeight: 700 }}>Créneau</div><div className="amt" style={{ fontWeight: 600, color: 'var(--muted)' }}>{dateShort(ad.scheduled_at)}</div></div>}
        </div>

        {ad.description && <div className="card"><div className="eyebrow" style={{ marginBottom: 6 }}>Description</div>{ad.description}</div>}

        {/* Auteur */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate(`/u/${ad.author.id}`)}>
          <Avatar user={ad.author} size="m" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>{ad.author.full_name} {ad.author.verified && '✅'}</div>
            <Stars value={ad.author.rating} count={ad.author.rating_count} />
          </div>
          {!mine && (CHATTABLE.includes(myApp?.status)
            ? <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); navigate(`/messages/${ad.author.id}`); }}>💬</button>
            : <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); showToast("Le chat s'ouvre une fois la candidature acceptée 🔒", 'error'); }}>🔒</button>)}
        </div>

        {/* Candidat */}
        {!mine && !closed && (myApp ? (
          <div className="card center">
            {myApp.status === 'pending' && <><div style={{ fontSize: 40 }}>⏳</div><div style={{ fontWeight: 800, marginTop: 6 }}>Candidature en attente</div><p className="sub">Le demandeur va examiner votre profil.</p></>}
            {myApp.status === 'accepted' && <>
              <div style={{ fontSize: 40 }}>🚀</div><div style={{ fontWeight: 800, marginTop: 6 }}>Vous êtes pris !</div>
              <p className="sub">Réalisez la mission puis marquez-la comme livrée.</p>
              <button className="btn coral" style={{ marginTop: 8 }} onClick={() => deliver(myApp.id)}>📦 Marquer comme livré</button>
            </>}
            {myApp.status === 'delivered' && <><div style={{ fontSize: 40 }}>📦</div><div style={{ fontWeight: 800, marginTop: 6 }}>Livré !</div><p className="sub">En attente de confirmation du demandeur pour libérer le pourboire.</p></>}
            {myApp.status === 'rejected' && <><div style={{ fontSize: 40 }}>😕</div><div style={{ fontWeight: 800, marginTop: 6 }}>Non retenue</div></>}
          </div>
        ) : ad.spots_left > 0 ? (
          <div className="card">
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Un mot pour convaincre ? (optionnel)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je peux vous aider rapidement…" />
            </div>
            <button className="btn coral" disabled={busy} onClick={apply}>🙋 Postuler à cette mission</button>
            <div className="suggest" style={{ marginTop: 10 }}>🎯 Même non retenu·e, vous gagnez des Tipper Points</div>
          </div>
        ) : <div className="card center muted">Complet — {ad.max_participants} participants atteints.</div>)}

        {/* Candidat terminé -> noter le demandeur */}
        {!mine && myApp?.status === 'completed' && !myReviewExists(ad.author.id) && (
          <button className="btn teal" onClick={() => setRating({ rateeId: ad.author.id, role: 'poster', title: `Noter ${ad.author.full_name}` })}>⭐ Noter le demandeur</button>
        )}

        {/* Gestion par l'auteur */}
        {mine && (
          <>
            <div className="h-sec" style={{ marginTop: 8 }}>Candidatures ({ad.applications?.length || 0})</div>
            {(!ad.applications || ad.applications.length === 0) && <div className="card center muted">Aucune candidature pour l'instant.</div>}
            {ad.applications?.map((a) => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate(`/u/${a.applicant.id}`)}>
                  <Avatar user={a.applicant} size="m" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{a.applicant.full_name} {a.applicant.verified && '✅'}</div>
                    <Stars value={a.applicant.rating} count={a.applicant.rating_count} />
                  </div>
                  <span className={`status ${a.status}`}>{STATUS_LABEL[a.status]}</span>
                </div>
                {a.message && <p style={{ fontSize: 14, margin: '10px 0 0', color: 'var(--ink-soft)' }}>« {a.message} »</p>}
                <div className="btn-row" style={{ marginTop: 12 }}>
                  {CHATTABLE.includes(a.status)
                    ? <button className="btn ghost sm" onClick={() => navigate(`/messages/${a.applicant.id}`)}>💬</button>
                    : <button className="btn ghost sm" onClick={() => showToast('Acceptez la candidature pour ouvrir le chat 🔒', 'error')}>🔒</button>}
                  {a.status === 'pending' && !closed && <>
                    <button className="btn danger sm" style={{ flex: 1 }} onClick={() => decide(a.id, 'reject')}>Refuser</button>
                    <button className="btn teal sm" style={{ flex: 1 }} onClick={() => decide(a.id, 'accept')}>Accepter</button>
                  </>}
                  {(a.status === 'accepted' || a.status === 'delivered') && <button className="btn coral sm" style={{ flex: 2 }} onClick={() => confirm(a.id)}>💰 Confirmer & payer</button>}
                  {a.status === 'completed' && !myReviewExists(a.applicant.id) && <button className="btn teal sm" style={{ flex: 2 }} onClick={() => setRating({ rateeId: a.applicant.id, role: 'helper', title: `Noter ${a.applicant.full_name}` })}>⭐ Noter</button>}
                </div>
              </div>
            ))}
            {!closed && <button className="btn outline" style={{ color: 'var(--danger)' }} onClick={cancelAd}>Annuler la mission</button>}
          </>
        )}

        {/* Avis sur la mission */}
        {ad.reviews?.length > 0 && (
          <>
            <div className="h-sec" style={{ marginTop: 8 }}>Avis</div>
            {ad.reviews.map((r) => (
              <div key={r.id} className="card" style={{ display: 'flex', gap: 12 }}>
                <Avatar user={r.rater} size="s" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.rater.full_name}</span>
                    <Stars value={r.stars} />
                  </div>
                  {r.comment && <p className="sub" style={{ margin: '4px 0 0' }}>{r.comment}</p>}
                </div>
              </div>
            ))}
          </>
        )}

        {(mine || myApp) && ['in_progress', 'delivered'].includes(ad.status) && (
          <button className="btn outline" style={{ marginTop: 8, color: 'var(--muted)' }} onClick={openDispute}>⚠️ Signaler un problème</button>
        )}
        <div className="spacer" />
      </div>

      {rating && <RatingSheet title={rating.title} onClose={() => setRating(null)} onSubmit={submitRating} />}
    </Screen>
  );
}

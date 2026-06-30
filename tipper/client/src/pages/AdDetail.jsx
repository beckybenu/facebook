import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Avatar, Stars, Sheet } from '../components/Layout.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { coin, chf, catLabel, catIcon, catTint, dateShort } from '../constants.js';

const CHATTABLE = ['accepted', 'delivered', 'completed'];

const STEPS = [
  { key: 'open', cap: 'Ouverte', i: 0 },
  { key: 'in_progress', cap: 'Acceptée', i: 1 },
  { key: 'delivered', cap: 'Livrée', i: 2 },
  { key: 'completed', cap: 'Terminée', i: 3 },
];
const stepIndex = { open: 0, in_progress: 1, delivered: 2, completed: 3, cancelled: 0 };

function Stepper({ status, t }) {
  const cur = stepIndex[status] ?? 0;
  return (
    <div className="stepper">
      {STEPS.map((s) => (
        <div key={s.key} className={`st ${s.i < cur ? 'done' : s.i === cur ? 'active' : ''}`}>
          <div className="bar" />
          <div className="ring">{s.i < cur ? '✓' : s.i + 1}</div>
          <div className="cap">{t(`step.${s.key}`)}</div>
        </div>
      ))}
    </div>
  );
}

function RatingSheet({ onClose, onSubmit, title, t }) {
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
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('ad.commentPh')} />
      </div>
      <button className="btn coral" disabled={busy} onClick={async () => { setBusy(true); await onSubmit(stars, comment); setBusy(false); }}>
        {t('ad.publishReview')}
      </button>
    </Sheet>
  );
}

export function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, refreshBadges, t } = useApp();
  const [ad, setAd] = useState(null);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
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
    try { await api.apply(id, message, offerPrice); showToast('Offre envoyée ! 🙌'); setMessage(''); setOfferPrice(''); load(); }
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
    if (!confirm('Annuler cette demande ? Le pourboire vous sera remboursé.')) return;
    try { await api.cancelAd(id); await refreshMe(); showToast('Demande annulée, escrow remboursé'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }
  async function boost() {
    if (!confirm('Booster cette demande « À la une » pour 24h (20 🪙) ?')) return;
    try { await api.boostAd(id); await refreshMe(); showToast('Demande boostée 🚀 elle passe en tête !'); load(); }
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
  const hasWinner = ad.applications?.some((a) => ['accepted', 'delivered', 'completed'].includes(a.status));
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
          {ad.urgent && <span className="tag urgent">{t('ad.urgent')}</span>}
          <span className={`status ${ad.status}`} style={{ marginLeft: 'auto' }}>{t(`status.${ad.status}`)}</span>
        </div>
        <h1 className="h-page" style={{ marginBottom: 12 }}>{ad.title}</h1>

        {ad.status !== 'cancelled' && <div className="card"><Stepper status={ad.status} t={t} /></div>}

        <div className="card">
          <div className="tx" style={{ borderBottom: '1px solid var(--line-soft)' }}>
            <div className="ic" style={{ background: '#e4f7f3' }}>💰</div>
            <div><div style={{ fontWeight: 800 }}>{t('ad.tip')}</div><div className="sub" style={{ fontSize: 12 }}>{t('ad.escrowDesc')}</div></div>
            <div className="amt" style={{ color: 'var(--teal)', fontSize: 18 }}>{coin(ad.tip_amount)}</div>
          </div>
          {ad.price != null && <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>🏷️</div><div style={{ fontWeight: 700 }}>{t('ad.price')}</div><div className="amt">{chf(ad.price)}</div></div>}
          <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>📍</div><div style={{ fontWeight: 700 }}>{ad.distance_km != null ? `${ad.distance_km} km` : (ad.city || '—')}</div><div className="amt" style={{ fontWeight: 600, color: 'var(--muted)' }}>{ad.spots_left}/{ad.max_participants} {t('ad.places')}</div></div>
          {ad.scheduled_at && <div className="tx"><div className="ic" style={{ background: 'var(--line-soft)' }}>🗓️</div><div style={{ fontWeight: 700 }}>{t('ad.schedule')}</div><div className="amt" style={{ fontWeight: 600, color: 'var(--muted)' }}>{dateShort(ad.scheduled_at)}</div></div>}
        </div>

        {ad.description && <div className="card"><div className="eyebrow" style={{ marginBottom: 6 }}>{t('ad.description')}</div>{ad.description}</div>}

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
            {myApp.status === 'pending' && <><div style={{ fontSize: 40 }}>⏳</div><div style={{ fontWeight: 800, marginTop: 6 }}>{t('ad.pendingTitle')}</div><p className="sub">{t('ad.pendingDesc')}</p><div className="sub" style={{ marginTop: 4, fontWeight: 700 }}>{t('ad.yourOffer')} : {myApp.price > 0 ? coin(myApp.price) : t('ad.offered')} + {coin(ad.tip_amount)}</div></>}
            {myApp.status === 'accepted' && <>
              <div style={{ fontSize: 40 }}>🚀</div><div style={{ fontWeight: 800, marginTop: 6 }}>{t('ad.youIn')}</div>
              <p className="sub">{t('ad.doMission')}</p>
              <div className="sub" style={{ fontWeight: 700 }}>{t('ad.yourOffer')} : {myApp.price > 0 ? coin(myApp.price) : t('ad.offered')} + {coin(ad.tip_amount)}</div>
              <button className="btn coral" style={{ marginTop: 8 }} onClick={() => deliver(myApp.id)}>{t('ad.deliver')}</button>
            </>}
            {myApp.status === 'delivered' && <><div style={{ fontSize: 40 }}>📦</div><div style={{ fontWeight: 800, marginTop: 6 }}>{t('ad.deliveredTitle')}</div><p className="sub">{t('ad.deliveredDesc')}</p></>}
            {myApp.status === 'rejected' && <><div style={{ fontSize: 40 }}>😕</div><div style={{ fontWeight: 800, marginTop: 6 }}>{t('ad.notKept')}</div></>}
          </div>
        ) : ad.spots_left > 0 ? (
          <div className="card">
            <div className="field" style={{ marginBottom: 12 }}>
              <label>{t('ad.offerPrice')}</label>
              <input type="number" min="0" step="0.5" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="0" />
              <div className="suggest" style={{ marginTop: 6 }}>{t('ad.offerHint')}</div>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>{t('ad.message')}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="…" />
            </div>
            <div className="suggest" style={{ marginBottom: 10 }}>{t('ad.totalLabel')} : {coin((parseFloat(offerPrice) || 0) + ad.tip_amount)} ({t('ad.item')} {offerPrice > 0 ? coin(parseFloat(offerPrice)) : t('ad.offered')} + {coin(ad.tip_amount)})</div>
            <button className="btn coral" disabled={busy} onClick={apply}>{t('ad.apply')}</button>
            <div className="suggest" style={{ marginTop: 10 }}>{t('ad.applyHint')}</div>
          </div>
        ) : <div className="card center muted">{t('ad.full2')}</div>)}

        {/* Candidat terminé -> noter le demandeur */}
        {!mine && myApp?.status === 'completed' && !myReviewExists(ad.author.id) && (
          <button className="btn teal" onClick={() => setRating({ rateeId: ad.author.id, role: 'poster', title: `${t('ad.rate')} ${ad.author.full_name}` })}>{t('ad.ratecta')}</button>
        )}

        {/* Gestion par l'auteur */}
        {mine && (
          <>
            <div className="h-sec" style={{ marginTop: 8 }}>{t('ad.candidatures')} ({ad.applications?.length || 0})</div>
            {(!ad.applications || ad.applications.length === 0) && <div className="card center muted">{t('ad.noCand')}</div>}
            {ad.applications?.map((a) => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate(`/u/${a.applicant.id}`)}>
                  <Avatar user={a.applicant} size="m" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{a.applicant.full_name} {a.applicant.verified && '✅'}</div>
                    <Stars value={a.applicant.rating} count={a.applicant.rating_count} />
                  </div>
                  <span className={`status ${a.status}`}>{t(`status.${a.status}`)}</span>
                </div>
                <div className="offer-row">
                  <span>{t('ad.item')} : <b>{a.price > 0 ? coin(a.price) : t('ad.offered')}</b></span>
                  <span className="offer-total">{t('ad.totalLabel')} {coin((a.price || 0) + ad.tip_amount)}</span>
                </div>
                {a.message && <p style={{ fontSize: 14, margin: '8px 0 0', color: 'var(--ink-soft)' }}>« {a.message} »</p>}
                <div className="btn-row" style={{ marginTop: 12 }}>
                  {CHATTABLE.includes(a.status)
                    ? <button className="btn ghost sm" onClick={() => navigate(`/messages/${a.applicant.id}`)}>💬</button>
                    : <button className="btn ghost sm" onClick={() => showToast(t('ad.chatLocked'), 'error')}>🔒</button>}
                  {a.status === 'pending' && !closed && (hasWinner
                    ? <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, alignSelf: 'center' }}>{t('ad.spotTaken')}</span>
                    : <>
                      <button className="btn danger sm" style={{ flex: 1 }} onClick={() => decide(a.id, 'reject')}>{t('ad.refuse')}</button>
                      <button className="btn teal sm" style={{ flex: 1 }} onClick={() => decide(a.id, 'accept')}>{t('ad.accept')}</button>
                    </>)}
                  {(a.status === 'accepted' || a.status === 'delivered') && <button className="btn coral sm" style={{ flex: 2 }} onClick={() => confirm(a.id)}>{t('ad.confirmPay')}</button>}
                  {a.status === 'completed' && !myReviewExists(a.applicant.id) && <button className="btn teal sm" style={{ flex: 2 }} onClick={() => setRating({ rateeId: a.applicant.id, role: 'helper', title: `${t('ad.rate')} ${a.applicant.full_name}` })}>{t('ad.rate')}</button>}
                </div>
              </div>
            ))}
            {!closed && (ad.boosted
              ? <div className="card center" style={{ background: 'rgba(255,210,63,0.1)', borderColor: 'rgba(255,210,63,0.3)' }}>{t('ad.boosted')}</div>
              : <button className="btn" style={{ background: 'linear-gradient(135deg,#ffd23f,#ff8a45)', color: '#2a1500', marginBottom: 10 }} onClick={boost}>{t('ad.boost')}</button>)}
            {!closed && <button className="btn outline" style={{ color: 'var(--danger)' }} onClick={cancelAd}>{t('ad.cancelMission')}</button>}
          </>
        )}

        {/* Avis sur la mission */}
        {ad.reviews?.length > 0 && (
          <>
            <div className="h-sec" style={{ marginTop: 8 }}>{t('ad.reviews')}</div>
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
          <button className="btn outline" style={{ marginTop: 8, color: 'var(--muted)' }} onClick={openDispute}>{t('ad.dispute')}</button>
        )}
        <div className="spacer" />
      </div>

      {rating && <RatingSheet title={rating.title} t={t} onClose={() => setRating(null)} onSubmit={submitRating} />}
    </Screen>
  );
}

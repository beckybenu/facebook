import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { Confetti } from '../components/fx.jsx';
import { feedback } from '../sound.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { catIcon, catTint, coin, TIP_SUGGESTION, priceMode } from '../constants.js';
import { PayExplainer } from '../components/Explain.jsx';

export function PostAd() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, captureLocation, t } = useApp();
  const fileRef = useRef();
  const suggestion = TIP_SUGGESTION[category] || 30;
  const isQuest = priceMode(category) === 'quest'; // auto/immo : le demandeur fixe le prix de vente

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [tip, setTip] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [urgent, setUrgent] = useState(false);
  const [scheduled, setScheduled] = useState('');
  const [useGeo, setUseGeo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recap, setRecap] = useState(false); // écran « Voici votre demande »

  function pickPhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f); setPreview(URL.createObjectURL(f));
  }

  // Étape 1 : on valide et on montre le récapitulatif. Rien n'est publié ici.
  function review(e) {
    e.preventDefault();
    if (!title.trim()) return showToast(t('post.errTitle'), 'error');
    if (!tip || Number(tip) <= 0) return showToast(t('post.errTip'), 'error');
    if (Number(tip) > user.available) return showToast(t('post.errBalance'), 'error');
    setRecap(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Étape 2 : publication réelle, après confirmation du récapitulatif.
  async function submit(e) {
    if (e) e.preventDefault();
    setBusy(true);
    try {
      let lat, lng;
      // On ne fait pas attendre la publication après le GPS : au-delà de 3 s
      // on publie sans coordonnées précises plutôt que de bloquer l'écran.
      if (useGeo) {
        try {
          const u = await Promise.race([
            captureLocation(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
          ]);
          if (u) { lat = u.lat; lng = u.lng; setUser(u); }
        } catch { /* on publie quand même */ }
      }
      const form = new FormData();
      form.append('category', category);
      form.append('title', title);
      if (isQuest && price) form.append('price', price); // prix de vente fixé par le demandeur (quêtes)
      form.append('tip_amount', tip);
      form.append('description', description);
      if (urgent) form.append('urgent', '1');
      if (scheduled) form.append('scheduled_at', new Date(scheduled).toISOString());
      if (lat != null) { form.append('lat', lat); form.append('lng', lng); }
      if (photo) form.append('photo', photo);
      await api.createAd(form);
      const { user: u } = await api.me(); setUser(u);
      navigate('/posted');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  // ── Récapitulatif : ce qui sera publié, avant de s'engager ──
  if (recap) {
    return (
      <Screen nav={false}>
        <AppBar title={t('ux.rec.title')} back={false} />
        <div className="content">
          <div className="eyebrow">{t('ux.rec.title')}</div>
          <p className="sub" style={{ margin: '6px 0 16px' }}>{t('ux.rec.d')}</p>

          <div className="recap">
            <div className="recap-row">
              <span className="r-k">{t('ux.rec.what')}</span>
              <span className="r-v">{title}</span>
            </div>
            {description && (
              <div className="recap-row">
                <span className="r-k">{t('post.descLabel')}</span>
                <span className="r-v" style={{ fontWeight: 400 }}>{description}</span>
              </div>
            )}
            <div className="recap-row">
              <span className="r-k">{t('ux.rec.when')}</span>
              <span className="r-v">{scheduled ? new Date(scheduled).toLocaleString() : t('ux.rec.asap')}</span>
            </div>
            <div className="recap-row">
              <span className="r-k">{t('ux.rec.where')}</span>
              <span className="r-v">{useGeo ? (user.city || '📍') : (user.city || t('ux.rec.noloc'))}</span>
            </div>
            {isQuest && price && (
              <div className="recap-row">
                <span className="r-k">{t('post.priceQuest')}</span>
                <span className="r-v">{coin(Number(price))}</span>
              </div>
            )}
            <div className="recap-row">
              <span className="r-k">{t('ux.rec.reward')}</span>
              <span className="r-v big">{coin(Number(tip))}</span>
            </div>
          </div>

          {/* Ce qui va arriver à l'argent, dit avant de publier */}
          <PayExplainer role="poster" />

          <button className="btn coral" disabled={busy} onClick={submit}>
            {busy ? t('post.publishing') : t('ux.rec.publish')}
          </button>
          <div className="spacer" />
          <button className="btn ghost" disabled={busy} onClick={() => setRecap(false)}>{t('ux.rec.edit')}</button>
          <div className="spacer" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen nav={false}>
      <AppBar title={t(`cat.${category}`)} back="/categories" />
      <form className="content" onSubmit={review}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="qa-ic" style={{ background: catTint(category) + '22', color: catTint(category), fontSize: 24, width: 50, height: 50 }}>{catIcon(category)}</div>
          <div>
            <div className="eyebrow">{t('post.step2')}</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{t('post.detail')}</div>
          </div>
        </div>

        <div className="field">
          <label>{t('post.seek')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('post.seekPh')} />
        </div>

        {isQuest && (
          <div className="field">
            <label>{t('post.priceQuest')}</label>
            <div className="input-prefix"><span>🪙</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="hint">{t('post.priceQuestHint')}</div>
          </div>
        )}

        <div className="field">
          <label>{t('post.tip')} 💰</label>
          <div className="input-prefix"><span>🪙</span>
            <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} placeholder={String(suggestion)} />
          </div>
          <div className="suggest" onClick={() => setTip(String(suggestion))}>💡 {t('post.suggested')} : {coin(suggestion)} · {t('post.use')}</div>
          <div className="hint">🔒 {t('post.escrow')} {coin(user.available)}</div>
          {priceMode(category) === 'offer' && <div className="suggest" style={{ marginTop: 6 }}>{t('post.offerNote')}</div>}
        </div>

        <div className="field">
          <label>{t('post.photo')}</label>
          <div className="photo-up" onClick={() => fileRef.current.click()}>
            {preview ? <img src={preview} alt="" /> : <span>📷 {t('post.addPhoto')}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        </div>

        <div className="field">
          <label>{t('post.descLabel')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('post.descPh')} />
        </div>

        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="switch-row" onClick={() => setUrgent(!urgent)}>
            <div><div style={{ fontWeight: 700 }}>⚡ {t('post.urgent')}</div><div className="sub" style={{ fontSize: 12.5 }}>{t('post.urgentDesc')}</div></div>
            <div className={`switch ${urgent ? 'on' : ''}`}><i /></div>
          </div>
          <div className="divider" style={{ margin: '4px 0' }} />
          <div className="switch-row" onClick={() => setUseGeo(!useGeo)}>
            <div><div style={{ fontWeight: 700 }}>📍 {t('post.geo')}</div><div className="sub" style={{ fontSize: 12.5 }}>{t('post.geoDesc')}</div></div>
            <div className={`switch ${useGeo ? 'on' : ''}`}><i /></div>
          </div>
        </div>

        <div className="field">
          <label>{t('post.slot')}</label>
          <input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
        </div>

        <button className="btn coral">{t('post.review')}</button>
        <div className="spacer" />
      </form>
    </Screen>
  );
}

export function Posted() {
  const navigate = useNavigate();
  const { t } = useApp();
  useEffect(() => { feedback('success'); }, []);
  return (
    <Screen nav={false}>
      <Confetti />
      <AppBar title="" back="/" />
      <div className="content center" style={{ paddingTop: 50 }}>
        <div style={{ fontSize: 72 }}>🎉</div>
        <h1 className="h-hero" style={{ margin: '12px 0' }}>{t('post.donePublished')}</h1>
        <p className="sub">{t('post.doneDesc')}</p>
        <div className="spacer" />
        <button className="btn coral" onClick={() => navigate('/explore')}>{t('post.exploreCta')}</button>
        <div className="spacer" />
        <button className="btn ghost" onClick={() => navigate('/profile')}>{t('post.myCta')}</button>
      </div>
    </Screen>
  );
}

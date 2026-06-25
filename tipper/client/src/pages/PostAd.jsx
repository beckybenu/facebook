import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, AppBar } from '../components/Layout.jsx';
import { Confetti } from '../components/fx.jsx';
import { feedback } from '../sound.js';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { catLabel, catIcon, catTint, chf, TIP_SUGGESTION } from '../constants.js';

const COPY = {
  automobile: { seek: 'Je vends / je cherche', seekPh: 'Voiture, Moto, Scooter…', price: 'Prix du bien', tip: 'Pourboire pour le helper' },
  epicerie: { seek: 'Je cherche', seekPh: 'Boissons, Tabac, Courses…', price: 'Prix des articles (optionnel)', tip: 'Pourboire offert' },
  immobilier: { seek: 'Je cherche', seekPh: 'Studio, Appart, Local…', price: 'Budget (optionnel)', tip: 'Pourboire offert' },
  default: { seek: 'Je cherche', seekPh: 'Décrivez en quelques mots…', price: 'Budget (optionnel)', tip: 'Pourboire offert' },
};

export function PostAd() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, captureLocation } = useApp();
  const copy = COPY[category] || COPY.default;
  const fileRef = useRef();
  const suggestion = TIP_SUGGESTION[category] || 30;

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

  function pickPhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return showToast('Décrivez ce que vous cherchez', 'error');
    if (!tip || Number(tip) <= 0) return showToast('Indiquez le pourboire offert', 'error');
    if (Number(tip) > user.available) return showToast('Solde disponible insuffisant. Rechargez votre wallet.', 'error');
    setBusy(true);
    try {
      let lat, lng;
      if (useGeo) { try { const u = await captureLocation(); lat = u.lat; lng = u.lng; setUser(u); } catch { /* ignore */ } }
      const form = new FormData();
      form.append('category', category);
      form.append('title', title);
      if (price) form.append('price', price);
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

  return (
    <Screen nav={false}>
      <AppBar title={catLabel(category)} back="/categories" />
      <form className="content" onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="qa-ic" style={{ background: catTint(category) + '22', color: catTint(category), fontSize: 24, width: 50, height: 50 }}>{catIcon(category)}</div>
          <div>
            <div className="eyebrow">Étape 2 / 2</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Détaillez votre mission</div>
          </div>
        </div>

        <div className="field">
          <label>{copy.seek}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.seekPh} />
        </div>

        <div className="field">
          <label>{copy.price}</label>
          <div className="input-prefix"><span>CHF</span>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="field">
          <label>{copy.tip} 💰</label>
          <div className="input-prefix"><span>CHF</span>
            <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} placeholder={String(suggestion)} />
          </div>
          <div className="suggest" onClick={() => setTip(String(suggestion))}>💡 Suggéré : {chf(suggestion)} · toucher pour utiliser</div>
          <div className="hint">🔒 Ce montant sera bloqué en séquestre et libéré à la fin. Disponible : {chf(user.available)}</div>
        </div>

        <div className="field">
          <label>Photo (optionnel)</label>
          <div className="photo-up" onClick={() => fileRef.current.click()}>
            {preview ? <img src={preview} alt="" /> : <span>📷 Ajouter une photo</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Donnez un maximum de détails pour attirer les meilleurs helpers…" />
        </div>

        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="switch-row" onClick={() => setUrgent(!urgent)}>
            <div><div style={{ fontWeight: 700 }}>⚡ Mission urgente</div><div className="sub" style={{ fontSize: 12.5 }}>Mise en avant dans le fil</div></div>
            <div className={`switch ${urgent ? 'on' : ''}`}><i /></div>
          </div>
          <div className="divider" style={{ margin: '4px 0' }} />
          <div className="switch-row" onClick={() => setUseGeo(!useGeo)}>
            <div><div style={{ fontWeight: 700 }}>📍 Géolocaliser</div><div className="sub" style={{ fontSize: 12.5 }}>Trouver des helpers proches</div></div>
            <div className={`switch ${useGeo ? 'on' : ''}`}><i /></div>
          </div>
        </div>

        <div className="field">
          <label>Créneau souhaité (optionnel)</label>
          <input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
        </div>

        <button className="btn coral" disabled={busy}>{busy ? 'Publication…' : 'Publier ma mission'}</button>
        <div className="spacer" />
      </form>
    </Screen>
  );
}

export function Posted() {
  const navigate = useNavigate();
  useEffect(() => { feedback('success'); }, []);
  return (
    <Screen nav={false}>
      <Confetti />
      <AppBar title="" back="/" />
      <div className="content center" style={{ paddingTop: 50 }}>
        <div style={{ fontSize: 72 }}>🎉</div>
        <h1 className="h-hero" style={{ margin: '12px 0' }}>Mission publiée !</h1>
        <p className="sub">Votre pourboire est bloqué en séquestre. Vous serez notifié dès qu'un helper postule.</p>
        <div className="spacer" />
        <button className="btn coral" onClick={() => navigate('/explore')}>Explorer les missions</button>
        <div className="spacer" />
        <button className="btn ghost" onClick={() => navigate('/profile')}>Voir mes missions</button>
      </div>
    </Screen>
  );
}

import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Screen, Header } from '../components/Layout.jsx';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api.js';
import { catLabel, catIcon, chf } from '../constants.js';

// Libellés adaptés par catégorie (proche des maquettes Automobile / Epicerie)
const COPY = {
  automobile: { seek: 'Je vends', seekPh: 'Voiture, Moto, Scooter, etc…', price: 'Pour', pricePh: "CHF 64'000.-", tip: "J'offre à celui qui trouve un acheteur" },
  epicerie: { seek: 'Je cherche', seekPh: 'Boissons, Tabacs…', price: 'Prix de l\'article (optionnel)', pricePh: 'CHF 12.-', tip: 'Pour ce service, j\'offre' },
  immobilier: { seek: 'Je cherche', seekPh: 'Studio, Appartement, Local…', price: 'Budget (optionnel)', pricePh: 'CHF 1200.-/mois', tip: "J'offre à celui qui trouve" },
  default: { seek: 'Je cherche', seekPh: 'Décrivez en quelques mots…', price: 'Prix / budget (optionnel)', pricePh: 'CHF 50.-', tip: "Pour ce service, j'offre" },
};

export function PostAd() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user, setUser, showToast, captureLocation } = useApp();
  const copy = COPY[category] || COPY.default;
  const fileRef = useRef();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [tip, setTip] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [useGeo, setUseGeo] = useState(true);

  function pickPhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return showToast('Indiquez ce que vous cherchez', 'error');
    if (!tip || Number(tip) <= 0) return showToast("Indiquez le pourboire que vous offrez", 'error');
    if (Number(tip) > user.wallet_balance) return showToast('Solde insuffisant. Rechargez votre wallet.', 'error');

    setBusy(true);
    try {
      let lat, lng;
      if (useGeo) {
        try { const u = await captureLocation(); lat = u.lat; lng = u.lng; setUser(u); }
        catch { /* on continue sans géoloc */ }
      }
      const form = new FormData();
      form.append('category', category);
      form.append('title', title);
      if (price) form.append('price', price);
      form.append('tip_amount', tip);
      form.append('description', description);
      if (lat != null) { form.append('lat', lat); form.append('lng', lng); }
      if (photo) form.append('photo', photo);
      await api.createAd(form);
      navigate('/posted');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  }

  return (
    <Screen>
      <Header title={catLabel(category)} back="/categories" />
      <form className="content" onSubmit={submit}>
        <button type="button" className="btn" style={{ marginBottom: 16 }} onClick={() => navigate('/categories')}>
          CHANGER DE RÔLE
        </button>

        <p className="section-hint">
          {catIcon(category)} Le prix comprend l'offre pour le service. Votre wallet garantit le pourboire — il n'est débité qu'à la fin de la prestation.
        </p>

        <div className="field">
          <label>{copy.seek}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.seekPh} />
        </div>

        <div className="field">
          <label>{copy.price}</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={copy.pricePh} />
        </div>

        <div className="field">
          <label>{copy.tip} 💰</label>
          <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="CHF 2000.-" />
          <div className="hint">Solde wallet : {chf(user.wallet_balance)}</div>
        </div>

        <div className="field">
          <label>Photo</label>
          <div className="photo-upload" onClick={() => fileRef.current.click()}>
            {preview ? <img src={preview} alt="" /> : <span>Choisissez la photo</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        </div>

        <div className="field">
          <label>Description de l'annonce</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="J'offre CHF 2000.- à celui qui arrive à me trouver un acheteur pour ma Mercedes S63 AMG 2016, valeur CHF 64'000.-" />
        </div>

        <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" checked={useGeo} onChange={(e) => setUseGeo(e.target.checked)} style={{ width: 'auto' }} />
          <span>📍 Géolocaliser mon annonce</span>
        </label>

        <button className="btn magenta" disabled={busy}>{busy ? 'Publication…' : 'POSTER VOTRE ANNONCE !'}</button>
        <div className="spacer" />
      </form>
    </Screen>
  );
}

export function Posted() {
  const navigate = useNavigate();
  return (
    <Screen>
      <Header title="TIPPER" back="/" />
      <div className="content center" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <h1 className="page-title center">Votre annonce a été postée, nous vous remercions</h1>
        <p className="section-hint center">Vous serez notifié dès qu'un utilisateur postule.</p>
        <div className="spacer" />
        <button className="btn" onClick={() => navigate('/feed')}>Voir les annonces</button>
        <div className="spacer" />
        <button className="btn ghost" onClick={() => navigate('/profile')}>Mes annonces</button>
      </div>
    </Screen>
  );
}

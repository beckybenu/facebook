import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const ALL_SERVICES = ['Dîner', 'Soirée', 'Compagnie', 'Voyage', 'Événements', 'Massage'];
const ALL_LANGUAGES = ['Français', 'Anglais', 'Allemand', 'Italien', 'Espagnol', 'Arabe'];

const EMPTY = {
  displayName: '', city: '', age: 21, gender: 'female', headline: '', bio: '',
  hourlyRate: 300, currency: 'CHF', services: [], languages: [], photoUrl: '', available: true,
};

export default function ProviderDashboard() {
  const [form, setForm] = useState(EMPTY);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/profiles/me/profile').then((p) => {
      if (p) {
        setForm({
          displayName: p.displayName, city: p.city, age: p.age, gender: p.gender,
          headline: p.headline, bio: p.bio, hourlyRate: p.hourlyRate, currency: p.currency,
          services: p.services, languages: p.languages, photoUrl: p.photoUrl, available: p.available,
        });
      }
    }).catch(() => {});
  }, []);

  const toggle = (key, value) => setForm((f) => {
    const list = f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value];
    return { ...f, [key]: list };
  });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback('');
    try {
      await api.put('/profiles/me/profile', form);
      setFeedback('Profil enregistré ✓');
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="dash-head">
        <h1 className="page-title">Mon profil</h1>
        <Link to="/bookings" className="btn btn-ghost btn-sm">Voir les demandes →</Link>
      </div>

      <form className="profile-form auth-card" onSubmit={save}>
        <div className="row">
          <label>Nom affiché
            <input required value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </label>
          <label>Ville
            <input required value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
        </div>
        <div className="row">
          <label>Âge
            <input type="number" min="18" max="99" required value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
          </label>
          <label>Tarif horaire (CHF)
            <input type="number" min="0" step="10" value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
          </label>
        </div>
        <label>Accroche
          <input maxLength={60} placeholder="Élégante & cultivée…" value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </label>
        <label>Présentation
          <textarea rows="4" value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <label>Photo (URL)
          <input type="url" placeholder="https://…" value={form.photoUrl}
            onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
        </label>

        <fieldset>
          <legend>Services</legend>
          <div className="chips">
            {ALL_SERVICES.map((s) => (
              <button type="button" key={s}
                className={`chip-toggle ${form.services.includes(s) ? 'on' : ''}`}
                onClick={() => toggle('services', s)}>{s}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Langues</legend>
          <div className="chips">
            {ALL_LANGUAGES.map((l) => (
              <button type="button" key={l}
                className={`chip-toggle ${form.languages.includes(l) ? 'on' : ''}`}
                onClick={() => toggle('languages', l)}>{l}</button>
            ))}
          </div>
        </fieldset>

        <label className="checkbox">
          <input type="checkbox" checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          Actuellement disponible
        </label>

        {feedback && <p className="feedback">{feedback}</p>}
        <button className="btn btn-primary block" disabled={busy}>
          {busy ? '…' : 'Enregistrer mon profil'}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProfileCard from '../components/ProfileCard.jsx';

export default function Favorites() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/favorites').then(setProfiles).catch(() => setProfiles([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (profile) => {
    await api.del(`/favorites/${profile.id}`).catch(() => {});
    setProfiles((list) => list.filter((p) => p.id !== profile.id));
  };

  return (
    <div className="container">
      <h1 className="page-title">Mes favoris</h1>
      {loading && <p className="muted">Chargement…</p>}
      {!loading && profiles.length === 0 && (
        <p className="empty">Aucun favori pour l’instant. <Link to="/">Parcourir l’annuaire</Link>.</p>
      )}
      <div className="grid">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} onToggleFavorite={remove} isFavorite />
        ))}
      </div>
    </div>
  );
}

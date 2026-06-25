import { useEffect, useMemo, useState } from 'react';
import { api, qs } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProfileCard from '../components/ProfileCard.jsx';

const SERVICES = ['Dîner', 'Soirée', 'Compagnie', 'Voyage', 'Événements', 'Massage'];
const SORTS = [
  { value: '', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'age_asc', label: 'Âge croissant' },
];

export default function Home() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [cities, setCities] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '', city: '', service: '', maxPrice: '', sort: '', available: false,
  });

  useEffect(() => {
    api.get('/profiles/cities').then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'client') {
      api.get('/favorites')
        .then((favs) => setFavorites(new Set(favs.map((f) => f.id))))
        .catch(() => {});
    } else {
      setFavorites(new Set());
    }
  }, [user]);

  const query = useMemo(() => qs({
    q: filters.q,
    city: filters.city,
    service: filters.service,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    available: filters.available ? 'true' : '',
  }), [filters]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get(`/profiles${query}`)
        .then(setProfiles)
        .catch(() => setProfiles([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const toggleFavorite = async (profile) => {
    if (user?.role !== 'client') return;
    const next = new Set(favorites);
    if (next.has(profile.id)) {
      next.delete(profile.id);
      await api.del(`/favorites/${profile.id}`).catch(() => {});
    } else {
      next.add(profile.id);
      await api.post(`/favorites/${profile.id}`).catch(() => {});
    }
    setFavorites(next);
  };

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Trouvez la compagnie idéale</h1>
          <p>Profils vérifiés de compagnie à travers la Suisse — discrétion et élégance.</p>
          <div className="hero-search">
            <input
              type="search"
              placeholder="Rechercher un nom, une ville, un style…"
              value={filters.q}
              onChange={set('q')}
            />
          </div>
        </div>
      </section>

      <div className="container layout">
        <aside className="filters">
          <h3>Filtres</h3>
          <label>
            Ville
            <select value={filters.city} onChange={set('city')}>
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>{c.city} ({c.count})</option>
              ))}
            </select>
          </label>
          <label>
            Service
            <select value={filters.service} onChange={set('service')}>
              <option value="">Tous les services</option>
              {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Prix max&nbsp;: {filters.maxPrice || '—'} CHF
            <input type="range" min="200" max="600" step="10"
              value={filters.maxPrice || 600} onChange={set('maxPrice')} />
          </label>
          <label>
            Trier par
            <select value={filters.sort} onChange={set('sort')}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={filters.available} onChange={set('available')} />
            Disponibles uniquement
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({
            q: '', city: '', service: '', maxPrice: '', sort: '', available: false,
          })}>Réinitialiser</button>
        </aside>

        <section className="results">
          <div className="results-head">
            <span className="muted">{loading ? 'Chargement…' : `${profiles.length} profil(s)`}</span>
          </div>
          {!loading && profiles.length === 0 && (
            <p className="empty">Aucun profil ne correspond à votre recherche.</p>
          )}
          <div className="grid">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onToggleFavorite={user?.role === 'client' ? toggleFavorite : undefined}
                isFavorite={favorites.has(p.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

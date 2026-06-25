import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Header, Spinner, Empty } from '../components/Layout.jsx';
import { AdCard } from '../components/AdCard.jsx';
import { CATEGORIES } from '../constants.js';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';

export function Feed() {
  const navigate = useNavigate();
  const { user, captureLocation, showToast } = useApp();
  const [ads, setAds] = useState([]);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (cat) params.category = cat;
      if (q) params.q = q;
      const { ads } = await api.listAds(params);
      setAds(ads);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [cat, q, showToast]);

  useEffect(() => { load(); }, [load]);

  async function locate() {
    try { await captureLocation(); showToast('Position mise à jour 📍'); load(); }
    catch (e) { showToast(e.message, 'error'); }
  }

  return (
    <Screen>
      <Header title="TIPPER" back="/" right={<button className="icon-btn" onClick={locate} title="Me localiser">📍</button>} />
      <div className="content">
        <div className="field" style={{ marginBottom: 12 }}>
          <input placeholder="🔍 Rechercher une annonce…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
          <button className={`btn sm ${cat === '' ? '' : 'ghost'}`} onClick={() => setCat('')}>Tout</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`btn sm ${cat === c.key ? '' : 'ghost'}`} style={{ whiteSpace: 'nowrap' }} onClick={() => setCat(c.key)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {!user?.lat && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>📍 Activez la géoloc pour trier par distance</span>
            <button className="btn sm" onClick={locate}>Activer</button>
          </div>
        )}

        {loading ? <Spinner /> : ads.length === 0 ? (
          <Empty icon="🔎" title="Aucune annonce" hint="Soyez le premier à publier une demande !" />
        ) : (
          <div className="feed-grid">
            {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}

        <div style={{ height: 12 }} />
        <button className="btn magenta" onClick={() => navigate('/categories')}>+ POSTER UNE ANNONCE</button>
      </div>
    </Screen>
  );
}

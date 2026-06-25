import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner, Empty, Sheet } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { CATEGORIES } from '../constants.js';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';

const SORTS = [
  { key: 'distance', label: 'Plus proches', icon: '📍' },
  { key: 'tip', label: 'Meilleur pourboire', icon: '💰' },
  { key: 'rating', label: 'Mieux notés', icon: '⭐' },
  { key: 'recent', label: 'Plus récentes', icon: '🕒' },
];

export function Explore() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [ads, setAds] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('distance');
  const [urgent, setUrgent] = useState(false);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    setAds(null);
    try {
      const params = { sort };
      if (cat) params.category = cat;
      if (q) params.q = q;
      if (urgent) params.urgent = '1';
      const { ads } = await api.listAds(params);
      setAds(ads);
    } catch (e) { showToast(e.message, 'error'); }
  }, [cat, q, sort, urgent, showToast]);

  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load]);

  async function toggleSave(id) {
    try { await api.toggleSave(id); load(); } catch (e) { showToast(e.message, 'error'); }
  }

  const sortLabel = SORTS.find((s) => s.key === sort)?.label;

  return (
    <Screen>
      <AppBar
        title="Explorer"
        subtitle={ads ? `${ads.length} mission${ads.length > 1 ? 's' : ''}` : '…'}
        right={<button className="iconbtn" onClick={() => navigate('/map')}>🗺️</button>}
      />
      <div className="content">
        <div className="field" style={{ marginBottom: 12 }}>
          <input placeholder="🔍 Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="pill-row">
          <button className={`pill ${urgent ? 'active' : ''}`} onClick={() => setUrgent(!urgent)}>⚡ Urgent</button>
          <button className="pill" onClick={() => setSheet(true)}>↕ {sortLabel}</button>
          <button className={`pill ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>Tout</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`pill ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(cat === c.key ? '' : c.key)}>{c.icon} {c.label}</button>
          ))}
        </div>

        {!ads ? <Spinner /> : ads.length === 0 ? (
          <Empty icon="🔍" title="Aucune mission" hint="Essayez d'élargir vos filtres" />
        ) : ads.map((a) => <Mission key={a.id} ad={a} onToggleSave={toggleSave} />)}
      </div>

      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          <div className="h-sec">Trier par</div>
          {SORTS.map((s) => (
            <div key={s.key} className="row" onClick={() => { setSort(s.key); setSheet(false); }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div className="grow"><div className="r-name">{s.label}</div></div>
              {sort === s.key && <span style={{ color: 'var(--coral)', fontWeight: 800 }}>✓</span>}
            </div>
          ))}
        </Sheet>
      )}
    </Screen>
  );
}

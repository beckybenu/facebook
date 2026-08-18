import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Empty, Sheet } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { SkeletonMission } from '../components/fx.jsx';
import { CATEGORIES } from '../constants.js';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';

// Tris disponibles — libellés traduits à l'affichage
const SORTS = [
  { key: 'distance', icon: '📍' },
  { key: 'tip', icon: '💰' },
  { key: 'rating', icon: '⭐' },
  { key: 'recent', icon: '🕒' },
];

export function Explore() {
  const navigate = useNavigate();
  const { showToast, t } = useApp();
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

  // `timer` et non `t` : `t` est la fonction de traduction dans ce composant
  useEffect(() => { const timer = setTimeout(load, q ? 250 : 0); return () => clearTimeout(timer); }, [load]);

  async function toggleSave(id) {
    try { await api.toggleSave(id); load(); } catch (e) { showToast(e.message, 'error'); }
  }

  const sortLabel = t(`ux.ex.s.${sort}`);

  return (
    <Screen>
      <AppBar
        title={t('ux.ex.title')}
        subtitle={ads ? `${ads.length} ${t(ads.length > 1 ? 'ux.ex.subN' : 'ux.ex.sub1')}` : '…'}
        right={<button className="iconbtn" onClick={() => navigate('/map')}>🗺️</button>}
      />
      <div className="content">
        <div className="field" style={{ marginBottom: 12 }}>
          <input placeholder={t('ux.ex.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <button className={`pill ${urgent ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setUrgent(!urgent)}>{t('ux.ex.urgent')}</button>
          <button className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSheet(true)}>⇅ {t('ux.ex.sort')} : {sortLabel}</button>
        </div>
        <div className="pill-row">
          <button className={`pill ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>{t('ux.ex.all')}</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`pill ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(cat === c.key ? '' : c.key)}>{c.icon} {t(`cat.${c.key}`)}</button>
          ))}
        </div>

        {!ads ? <><SkeletonMission /><SkeletonMission /><SkeletonMission /></> : ads.length === 0 ? (
          <Empty icon="🔍" title={t('ux.ex.empty')} hint={t('ux.ex.emptyH')} />
        ) : ads.map((a) => <Mission key={a.id} ad={a} onToggleSave={toggleSave} />)}
      </div>

      {sheet && (
        <Sheet onClose={() => setSheet(false)}>
          <div className="h-sec">{t('ux.ex.sortBy')}</div>
          {SORTS.map((s) => (
            <div key={s.key} className="row" onClick={() => { setSort(s.key); setSheet(false); }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div className="grow"><div className="r-name">{t(`ux.ex.s.${s.key}`)}</div></div>
              {sort === s.key && <span style={{ color: 'var(--coral)', fontWeight: 800 }}>✓</span>}
            </div>
          ))}
        </Sheet>
      )}
    </Screen>
  );
}

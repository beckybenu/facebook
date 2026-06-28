import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coin, catLabel, catIcon, catGradient, catCover } from '../constants.js';
import { Stars } from './Layout.jsx';

export function Mission({ ad, onToggleSave }) {
  const navigate = useNavigate();
  const [imgOk, setImgOk] = useState(true);
  const cover = ad.photo || catCover(ad.category);
  return (
    <div className="mission fade-in" onClick={() => navigate(`/ads/${ad.id}`)}>
      <div className="m-cover" style={{ background: catGradient(ad.category) }}>
        {cover && imgOk && <img src={cover} alt="" loading="lazy" onError={() => setImgOk(false)} />}
        {!(cover && imgOk) && <span className="m-cover-ic">{catIcon(ad.category)}</span>}
        <div className="m-cover-grad" />
        <div className="m-badges">
          {ad.boosted && <span className="kind-badge boost">🚀 À la une</span>}
          {ad.kind === 'instant' && <span className="kind-badge instant">⚡ Now</span>}
          {ad.kind === 'quest' && <span className="kind-badge quest">🎯 Quest</span>}
          {ad.urgent && ad.kind !== 'instant' && <span className="tag urgent">⚡ Urgent</span>}
        </div>
        {onToggleSave && (
          <button className={`save-btn floating ${ad.is_saved ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleSave(ad.id); }}>
            {ad.is_saved ? '♥' : '♡'}
          </button>
        )}
        <div className="m-tip">{coin(ad.tip_amount)}</div>
      </div>
      <div className="m-body">
        <span className="tag cat">{catLabel(ad.category)}</span>
        <div className="m-title">{ad.title}</div>
        {ad.description && <div className="m-desc">{ad.description}</div>}
        <div className="m-meta">
          <span>📍 {ad.distance_km != null ? `${ad.distance_km} km` : (ad.city || '—')}</span>
          <Stars value={ad.author?.rating} />
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: ad.is_full ? 'var(--danger)' : ad.spots_left === 1 ? 'var(--amber)' : 'var(--muted)' }}>
            {ad.is_full ? '✋ Complet' : `${ad.spots_left}/${ad.max_participants} places`}
          </span>
        </div>
      </div>
    </div>
  );
}

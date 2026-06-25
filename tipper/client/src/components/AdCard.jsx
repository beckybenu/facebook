import { useNavigate } from 'react-router-dom';
import { chf, catLabel, catIcon, catTint, timeAgo } from '../constants.js';
import { Stars } from './Layout.jsx';

export function Mission({ ad, onToggleSave }) {
  const navigate = useNavigate();
  return (
    <div className="mission fade-in" onClick={() => navigate(`/ads/${ad.id}`)}>
      <div className="top">
        <div className="thumb" style={{ background: ad.photo ? 'transparent' : catTint(ad.category) }}>
          {ad.photo ? <img src={ad.photo} alt="" /> : catIcon(ad.category)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="tag cat">{catLabel(ad.category)}</span>
            {ad.urgent && <span className="tag urgent">⚡ Urgent</span>}
          </div>
          <div className="m-title">{ad.title}</div>
          <div className="m-desc">{ad.description}</div>
        </div>
        {onToggleSave && (
          <button className={`save-btn ${ad.is_saved ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleSave(ad.id); }}>
            {ad.is_saved ? '♥' : '♡'}
          </button>
        )}
      </div>
      <div className="m-foot">
        <div className="m-meta">
          <span>📍 {ad.distance_km != null ? `${ad.distance_km} km` : (ad.city || '—')}</span>
          <Stars value={ad.author?.rating} />
          <span style={{ marginLeft: 'auto' }}>{ad.spots_left}/{ad.max_participants} places</span>
        </div>
        <div className="tip-badge">{chf(ad.tip_amount)}</div>
      </div>
    </div>
  );
}

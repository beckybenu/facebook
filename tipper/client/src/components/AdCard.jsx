import { useNavigate } from 'react-router-dom';
import { chf, catLabel } from '../constants.js';

export function AdCard({ ad }) {
  const navigate = useNavigate();
  return (
    <div className="ad-card" onClick={() => navigate(`/ads/${ad.id}`)}>
      {ad.photo
        ? <img className="photo" src={ad.photo} alt={ad.title} />
        : <div className="photo placeholder">📷</div>}
      <div className="body">
        <span className="chip-cat">{catLabel(ad.category)}</span>
        <div className="title">{ad.title}</div>
        {ad.price != null && <div className="meta">Pour {chf(ad.price)}</div>}
        <div className="meta">j'offre <span className="tip">{chf(ad.tip_amount)}</span></div>
        {ad.description && <div className="desc">{ad.description}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          {ad.distance_km != null
            ? <span className="distance">📍 {ad.distance_km} km</span>
            : <span className="distance">📍 {ad.city || '—'}</span>}
          <span className="muted" style={{ fontSize: 11 }}>{ad.spots_left}/{ad.max_participants} places</span>
        </div>
      </div>
      <div className="footer">
        <button className="btn sm" style={{ width: '100%' }} onClick={(e) => { e.stopPropagation(); navigate(`/ads/${ad.id}`); }}>
          POSTULER
        </button>
      </div>
    </div>
  );
}

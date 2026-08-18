import { useNavigate } from 'react-router-dom';
import { coin, catIcon, catTint } from '../constants.js';
import { useApp } from '../context/AppContext.jsx';
import { Stars } from './Layout.jsx';

// Carte d'une demande dans un fil. Montre l'essentiel pour décider :
// de quoi il s'agit, où c'est, qui demande, et la récompense.
export function Mission({ ad, onToggleSave }) {
  const navigate = useNavigate();
  const { t } = useApp();
  const spots = ad.spots_left;
  return (
    <div className="mission fade-in" onClick={() => navigate(`/ads/${ad.id}`)}>
      <div className="top">
        <div className="thumb" style={{ background: ad.photo ? 'transparent' : catTint(ad.category) }}>
          {ad.photo ? <img src={ad.photo} alt="" /> : catIcon(ad.category)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {ad.boosted && <span className="kind-badge boost">{t('ux.card.featured')}</span>}
            <span className="tag cat">{t(`cat.${ad.category}`)}</span>
            {ad.urgent && <span className="tag urgent">{t('ux.card.urgent')}</span>}
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
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: ad.is_full ? 'var(--danger)' : spots === 1 ? 'var(--amber)' : 'inherit' }}>
            {ad.is_full ? t('ux.card.full') : `${spots} ${t(spots === 1 ? 'ux.card.spot' : 'ux.card.spots')}`}
          </span>
        </div>
        {/* La récompense est ce qui décide un aidant : on la met en évidence */}
        <div className="tip-badge">{coin(ad.tip_amount)}</div>
      </div>
    </div>
  );
}

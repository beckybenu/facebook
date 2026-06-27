import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';

export default function ProfileCard({ profile, onToggleFavorite, isFavorite }) {
  return (
    <article className="card">
      <Link to={`/profile/${profile.id}`} className="card-photo">
        <img src={profile.photoUrl} alt={profile.displayName} loading="lazy" />
        {profile.verified && <span className="chip chip-verified">✓ Vérifiée</span>}
        <span className={`chip chip-status ${profile.available ? 'on' : 'off'}`}>
          {profile.available ? 'Disponible' : 'Indisponible'}
        </span>
        {onToggleFavorite && (
          <button
            className={`fav ${isFavorite ? 'on' : ''}`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={(e) => { e.preventDefault(); onToggleFavorite(profile); }}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        )}
      </Link>
      <div className="card-body">
        <div className="card-head">
          <Link to={`/profile/${profile.id}`} className="card-name">
            {profile.displayName}, {profile.age}
          </Link>
          <span className="price">{profile.hourlyRate} {profile.currency}<small>/h</small></span>
        </div>
        <p className="card-city">📍 {profile.city}</p>
        <p className="card-headline">{profile.headline}</p>
        <div className="tags">
          {profile.services.slice(0, 3).map((s) => <span key={s} className="tag">{s}</span>)}
        </div>
        <Stars value={profile.rating} count={profile.reviewCount} />
      </div>
    </article>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Stars from '../components/Stars.jsx';

export default function ProfileDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({ date: '', duration: 2, note: '' });
  const [feedback, setFeedback] = useState('');
  const [myRating, setMyRating] = useState(0);

  useEffect(() => {
    api.get(`/profiles/${id}`).then(setProfile).catch(() => setError('Profil introuvable'));
    api.get(`/profiles/${id}/reviews`).then(setReviews).catch(() => {});
  }, [id]);

  if (error) return <div className="container"><p className="empty">{error}</p></div>;
  if (!profile) return <div className="container"><p className="muted">Chargement…</p></div>;

  const isClient = user?.role === 'client';

  const submitBooking = async (e) => {
    e.preventDefault();
    setFeedback('');
    if (!user) return navigate('/login');
    try {
      await api.post('/bookings', { profileId: profile.id, ...booking });
      setFeedback('Demande de réservation envoyée ! Suivez-la dans « Réservations ».');
      setBooking({ date: '', duration: 2, note: '' });
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const startConversation = async () => {
    if (!user) return navigate('/login');
    navigate(`/messages/${profile.userId}`);
  };

  const submitReview = async (rating) => {
    setMyRating(rating);
    try {
      await api.post(`/reviews/${profile.id}`, { rating });
      const [p, r] = await Promise.all([
        api.get(`/profiles/${id}`),
        api.get(`/profiles/${id}/reviews`),
      ]);
      setProfile(p);
      setReviews(r);
      setFeedback('Merci pour votre avis !');
    } catch (err) {
      setFeedback(err.message);
    }
  };

  return (
    <div className="container detail">
      <Link to="/" className="back">← Retour à l’annuaire</Link>
      <div className="detail-grid">
        <div className="detail-photo">
          <img src={profile.photoUrl} alt={profile.displayName} />
          {profile.verified && <span className="chip chip-verified">✓ Vérifiée</span>}
        </div>

        <div className="detail-main">
          <div className="detail-head">
            <h1>{profile.displayName}, {profile.age}</h1>
            <span className="price big">{profile.hourlyRate} {profile.currency}<small>/h</small></span>
          </div>
          <p className="card-city">📍 {profile.city}</p>
          <Stars value={profile.rating} count={profile.reviewCount} />
          <p className="lead">{profile.headline}</p>
          <p>{profile.bio}</p>

          <div className="detail-meta">
            <div>
              <h4>Services</h4>
              <div className="tags">{profile.services.map((s) => <span key={s} className="tag">{s}</span>)}</div>
            </div>
            <div>
              <h4>Langues</h4>
              <div className="tags">{profile.languages.map((l) => <span key={l} className="tag tag-alt">{l}</span>)}</div>
            </div>
            <div>
              <h4>Disponibilité</h4>
              <span className={`chip chip-status ${profile.available ? 'on' : 'off'}`}>
                {profile.available ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-ghost" onClick={startConversation}>✉ Envoyer un message</button>
          </div>

          {isClient && (
            <form className="booking-form" onSubmit={submitBooking}>
              <h3>Demander une réservation</h3>
              <div className="row">
                <label>
                  Date &amp; heure
                  <input type="datetime-local" required
                    value={booking.date}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
                </label>
                <label>
                  Durée (h)
                  <input type="number" min="1" max="24"
                    value={booking.duration}
                    onChange={(e) => setBooking({ ...booking, duration: e.target.value })} />
                </label>
              </div>
              <label>
                Message (optionnel)
                <textarea rows="3" placeholder="Lieu, contexte, attentes…"
                  value={booking.note}
                  onChange={(e) => setBooking({ ...booking, note: e.target.value })} />
              </label>
              <button className="btn btn-primary" type="submit">Envoyer la demande</button>
            </form>
          )}
          {!user && (
            <p className="muted">
              <Link to="/login">Connectez-vous</Link> en tant que client pour réserver ou contacter.
            </p>
          )}
          {feedback && <p className="feedback">{feedback}</p>}
        </div>
      </div>

      <section className="reviews">
        <h3>Avis ({reviews.length})</h3>
        {isClient && (
          <div className="review-add">
            <span>Votre note&nbsp;:</span>
            <Stars value={myRating} onRate={submitReview} />
            <span className="muted small">(réservé aux clients ayant réservé)</span>
          </div>
        )}
        {reviews.length === 0 && <p className="muted">Pas encore d’avis.</p>}
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r.id}>
              <div className="review-head">
                <strong>{r.author}</strong>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

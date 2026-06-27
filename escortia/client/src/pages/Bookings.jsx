import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const STATUS_LABEL = {
  pending: 'En attente', accepted: 'Acceptée', declined: 'Refusée',
  completed: 'Terminée', cancelled: 'Annulée',
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/bookings').then(setBookings).catch(() => setBookings([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const update = async (id, status) => {
    await api.patch(`/bookings/${id}`, { status }).catch(() => {});
    load();
  };

  const isProvider = user?.role === 'provider';

  return (
    <div className="container">
      <h1 className="page-title">{isProvider ? 'Demandes reçues' : 'Mes réservations'}</h1>
      {loading && <p className="muted">Chargement…</p>}
      {!loading && bookings.length === 0 && (
        <p className="empty">Aucune réservation. <Link to="/">Parcourir l’annuaire</Link>.</p>
      )}
      <ul className="booking-list">
        {bookings.map((b) => (
          <li key={b.id} className="booking-row">
            <div className="booking-info">
              {isProvider ? (
                <strong>{b.client_name}</strong>
              ) : (
                <Link to={`/profile/${b.profile_id}`} className="booking-with">
                  {b.profile_photo && <img src={b.profile_photo} alt="" />}
                  <strong>{b.profile_name}</strong>
                  <span className="muted">{b.profile_city}</span>
                </Link>
              )}
              <span className="muted">📅 {formatDate(b.date)} · {b.duration} h</span>
              {b.note && <span className="booking-note">“{b.note}”</span>}
            </div>
            <div className="booking-side">
              <span className={`status status-${b.status}`}>{STATUS_LABEL[b.status]}</span>
              {isProvider && b.status === 'pending' && (
                <div className="booking-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => update(b.id, 'accepted')}>Accepter</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => update(b.id, 'declined')}>Refuser</button>
                </div>
              )}
              {isProvider && b.status === 'accepted' && (
                <button className="btn btn-sm btn-ghost" onClick={() => update(b.id, 'completed')}>Marquer terminée</button>
              )}
              {!isProvider && b.status === 'pending' && (
                <button className="btn btn-sm btn-ghost" onClick={() => update(b.id, 'cancelled')}>Annuler</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value) {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' });
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;
    const load = () => api.get('/messages/unread/count')
      .then((r) => active && setUnread(r.count))
      .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">Escortia<span>.ch</span></Link>
        <nav className="nav-links">
          <NavLink to="/" end>Annuaire</NavLink>
          {user && <NavLink to="/bookings">Réservations</NavLink>}
          {user && (
            <NavLink to="/messages">
              Messages{unread > 0 && <span className="badge">{unread}</span>}
            </NavLink>
          )}
          {user?.role === 'client' && <NavLink to="/favorites">Favoris</NavLink>}
          {user?.role === 'provider' && <NavLink to="/dashboard">Mon profil</NavLink>}
        </nav>
        <div className="nav-auth">
          {user ? (
            <>
              <span className="nav-user">{user.displayName}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" to="/login">Connexion</Link>
              <Link className="btn btn-primary btn-sm" to="/register">Inscription</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

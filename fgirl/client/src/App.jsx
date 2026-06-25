import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import NavBar from './components/NavBar.jsx';
import AgeGate from './components/AgeGate.jsx';
import Home from './pages/Home.jsx';
import ProfileDetail from './pages/ProfileDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Favorites from './pages/Favorites.jsx';
import Bookings from './pages/Bookings.jsx';
import Messages from './pages/Messages.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';

const AGE_KEY = 'fgirl_age_ok';

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><p className="muted">Chargement…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [ageOk, setAgeOk] = useState(() => localStorage.getItem(AGE_KEY) === 'true');

  useEffect(() => {
    if (ageOk) localStorage.setItem(AGE_KEY, 'true');
  }, [ageOk]);

  if (!ageOk) return <AgeGate onConfirm={() => setAgeOk(true)} />;

  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:id" element={<ProfileDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/favorites" element={<Protected role="client"><Favorites /></Protected>} />
          <Route path="/bookings" element={<Protected><Bookings /></Protected>} />
          <Route path="/messages" element={<Protected><Messages /></Protected>} />
          <Route path="/messages/:userId" element={<Protected><Messages /></Protected>} />
          <Route path="/dashboard" element={<Protected role="provider"><ProviderDashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <p>Fgirl — annuaire de compagnie réservé aux adultes (18+). Clone éducatif de Fgirl.ch.</p>
        </div>
      </footer>
    </>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate(form.role === 'provider' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="auth-card">
        <h1>Inscription</h1>
        <form onSubmit={submit}>
          <div className="role-toggle">
            <button type="button"
              className={form.role === 'client' ? 'on' : ''}
              onClick={() => setForm({ ...form, role: 'client' })}>
              Je cherche de la compagnie
            </button>
            <button type="button"
              className={form.role === 'provider' ? 'on' : ''}
              onClick={() => setForm({ ...form, role: 'provider' })}>
              Je propose mes services
            </button>
          </div>
          <label>
            Nom affiché
            <input required value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </label>
          <label>
            Email
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Mot de passe (min. 6 caractères)
            <input type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary block" disabled={busy}>
            {busy ? '…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="muted">Déjà inscrit ? <Link to="/login">Connectez-vous</Link></p>
      </div>
    </div>
  );
}

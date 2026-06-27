import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="auth-card">
        <h1>Connexion</h1>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Mot de passe
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary block" disabled={busy}>
            {busy ? '…' : 'Se connecter'}
          </button>
        </form>
        <p className="muted">Pas de compte ? <Link to="/register">Inscrivez-vous</Link></p>
        <p className="muted small">Démo&nbsp;: client@demo.ch / elena@demo.ch — mot de passe <code>password123</code></p>
      </div>
    </div>
  );
}

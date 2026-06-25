import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export function Login() {
  const { login, showToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">TIPPER</div>
        <div className="auth-title">Connexion</div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" required />
        </div>
        <button className="btn magenta" disabled={busy}>{busy ? '…' : 'SE CONNECTER'}</button>
        <div className="auth-link" onClick={() => navigate('/signup')}>Pas encore de compte ? S'inscrire</div>
        <div className="center muted" style={{ fontSize: 12, marginTop: 14 }}>
          Démo : sophie@tipper.app / password
        </div>
      </form>
    </div>
  );
}

export function Signup() {
  const { signup, showToast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(form);
      showToast('Bienvenue sur Tipper ! 🎉 +CHF 50 offerts');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">TIPPER</div>
        <div className="auth-title">Inscription</div>
        <div className="field">
          <label>Nom complet</label>
          <input value={form.full_name} onChange={set('full_name')} placeholder="Jean Dupont" required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="6 caractères min." required />
        </div>
        <button className="btn magenta" disabled={busy}>{busy ? '…' : "S'INSCRIRE"}</button>
        <div className="auth-link" onClick={() => navigate('/login')}>Déjà un compte ? Se connecter</div>
      </form>
    </div>
  );
}

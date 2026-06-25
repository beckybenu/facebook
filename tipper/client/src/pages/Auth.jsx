import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

function Logo() {
  return (
    <>
      <div className="logo">Tipper<span className="dot">.</span></div>
      <div className="tagline">Un coup de main, un pourboire. Entraide rémunérée entre voisins.</div>
    </>
  );
}

export function Login() {
  const { login, showToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <Logo />
      <form className="auth-card" onSubmit={submit}>
        <div className="h-page" style={{ marginBottom: 16 }}>Bon retour 👋</div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" autoComplete="email" required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" required />
        </div>
        <button className="btn coral" disabled={busy}>{busy ? '…' : 'Se connecter'}</button>
        <div className="auth-switch" onClick={() => navigate('/signup')}>Nouveau ici ? <b>Créer un compte</b></div>
      </form>
      <div className="center muted" style={{ fontSize: 12, marginTop: 18 }}>
        Démo : <b>sophie@tipper.app</b> · mot de passe <b>password</b>
      </div>
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
    try { await signup(form); showToast('Bienvenue ! 🎉 CHF 50 offerts'); navigate('/'); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <Logo />
      <form className="auth-card" onSubmit={submit}>
        <div className="h-page" style={{ marginBottom: 16 }}>Créer un compte</div>
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
        <button className="btn coral" disabled={busy}>{busy ? '…' : 'Créer mon compte'}</button>
        <div className="auth-switch" onClick={() => navigate('/login')}>Déjà inscrit ? <b>Se connecter</b></div>
      </form>
    </div>
  );
}

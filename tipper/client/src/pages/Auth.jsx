import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { LANGS } from '../i18n.js';

function LangSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
      {LANGS.map((l) => (
        <button key={l.code} className={`pill ${lang === l.code ? 'active' : ''}`} onClick={() => setLang(l.code)}>{l.flag} {l.label}</button>
      ))}
    </div>
  );
}

function Logo() {
  const { t } = useApp();
  return (
    <>
      <div className="logo">Tipper<span className="dot">.</span></div>
      <div className="tagline">{t('auth.tagline')}</div>
    </>
  );
}

export function Login() {
  const { login, showToast, t } = useApp();
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
      <LangSwitch />
      <Logo />
      <form className="auth-card" onSubmit={submit}>
        <div className="h-page" style={{ marginBottom: 16 }}>{t('auth.welcome')}</div>
        <div className="field">
          <label>{t('auth.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required />
        </div>
        <div className="field">
          <label>{t('auth.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" required />
        </div>
        <button className="btn coral" disabled={busy}>{busy ? '…' : t('auth.signin')}</button>
        <div className="auth-switch" onClick={() => navigate('/signup')}>{t('auth.new')} <b>{t('auth.create')}</b></div>
      </form>
      <div className="center muted" style={{ fontSize: 12, marginTop: 18 }}>
        Démo : <b>sophie@tipper.app</b> · password <b>password</b>
      </div>
    </div>
  );
}

export function Signup() {
  const { signup, showToast, t } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await signup(form); showToast('🎉 +50 🪙'); navigate('/'); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <LangSwitch />
      <Logo />
      <form className="auth-card" onSubmit={submit}>
        <div className="h-page" style={{ marginBottom: 16 }}>{t('auth.title.signup')}</div>
        <div className="field">
          <label>{t('auth.fullname')}</label>
          <input value={form.full_name} onChange={set('full_name')} placeholder="Jean Dupont" required />
        </div>
        <div className="field">
          <label>{t('auth.email')}</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" required />
        </div>
        <div className="field">
          <label>{t('auth.password')}</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="6+" required />
        </div>
        <button className="btn coral" disabled={busy}>{busy ? '…' : t('auth.createmy')}</button>
        <div className="auth-switch" onClick={() => navigate('/login')}>{t('auth.already')} <b>{t('auth.signin')}</b></div>
      </form>
    </div>
  );
}

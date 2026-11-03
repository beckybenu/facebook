import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LOGO } from '../lib/utils'
import { useLang } from '../lib/i18n'

export default function Login() {
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await login(email, password)
    setBusy(false)
    if (res.ok) navigate('/home')
    else setError(res.error || 'Connexion impossible.')
  }

  return (
    <div className="app-shell">
      <div className="auth-screen">
        <div className="auth-logo" style={{ margin: '12px 0 8px' }}>
          <img src={LOGO} alt="SwissPaints" style={{ width: 'auto', maxWidth: 200, height: 'auto' }} />
        </div>
        <h2 className="auth-title">{t('auth.login')}</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre adresse mail…"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? '…' : t('auth.login')}
          </button>
        </form>

        <div className="auth-links">
          <button
            className="link"
            onClick={() => alert('Démo : contactez votre administrateur pour réinitialiser le mot de passe.')}
          >
            {t('auth.forgot')}
          </button>
        </div>
        <div className="auth-links" style={{ marginTop: 4 }}>
          {t('auth.noAccount')} <Link to="/inscription">{t('auth.signup')}</Link>
        </div>
      </div>
    </div>
  )
}

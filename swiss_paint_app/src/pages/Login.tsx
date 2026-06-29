import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LOGO } from '../lib/utils'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = login(email, password)
    if (res.ok) navigate('/home')
    else setError(res.error || 'Connexion impossible.')
  }

  return (
    <div className="app-shell">
      <div className="auth-screen">
        <div className="auth-logo" style={{ margin: '12px 0 8px' }}>
          <img src={LOGO} alt="SwissPaints" style={{ width: 80, height: 80 }} />
        </div>
        <h2 className="auth-title">Connexion</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
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
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe…"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Se connecter
          </button>
        </form>

        <div className="auth-links">
          <button
            className="link"
            onClick={() => alert('Démo : contactez votre administrateur pour réinitialiser le mot de passe.')}
          >
            Mot de passe oublié ?
          </button>
        </div>
        <div className="auth-links" style={{ marginTop: 4 }}>
          Pas encore de compte ? <Link to="/inscription">Inscription</Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { LOGO } from '../lib/utils'

export default function Welcome() {
  return (
    <div className="app-shell">
      <div className="auth-screen">
        <div className="auth-logo">
          <img src={LOGO} alt="SwissPaints Group Sàrl" />
          <div className="muted" style={{ marginTop: 10 }}>
            L'application de vos chantiers
          </div>
        </div>

        <h2 className="auth-title">Bienvenue</h2>

        <div style={{ flex: 1 }} />

        <Link to="/login" className="btn btn-primary" style={{ marginBottom: 12 }}>
          Se connecter
        </Link>
        <Link to="/inscription" className="btn btn-outline">
          Inscription
        </Link>

        <div className="demo-box">
          <b>Comptes de démonstration</b>
          Admin&nbsp;: <code>admin@swisspaints.ch</code> / <code>admin</code>
          <br />
          Ouvrier&nbsp;: <code>ouvrier@swisspaints.ch</code> / <code>ouvrier</code>
          <br />
          Client&nbsp;: <code>client@example.com</code> / <code>client</code>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="app-shell">
      <div className="auth-screen">
        <div className="auth-logo">
          <img src="/favicon.svg" alt="Swiss Paint" />
          <div className="brand">
            SWISS <span className="red">PAINT</span>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
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
          Admin&nbsp;: <code>admin@swisspaint.ch</code> / <code>admin</code>
          <br />
          Ouvrier&nbsp;: <code>ouvrier@swisspaint.ch</code> / <code>ouvrier</code>
          <br />
          Client&nbsp;: <code>client@example.com</code> / <code>client</code>
        </div>
      </div>
    </div>
  )
}

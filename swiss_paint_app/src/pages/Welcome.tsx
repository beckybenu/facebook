import { Link } from 'react-router-dom'
import { LOGO } from '../lib/utils'
import { useLang, LANGS } from '../lib/i18n'

export default function Welcome() {
  const { t, lang, setLang } = useLang()
  return (
    <div className="app-shell">
      <div className="auth-screen">
        <div className="auth-lang">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`auth-lang-btn ${lang === l.code ? 'on' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <div className="auth-logo">
          <img src={LOGO} alt="SwissPaints Group Sàrl" />
          <div className="muted" style={{ marginTop: 10 }}>
            {t('auth.tagline')}
          </div>
        </div>

        <h2 className="auth-title">{t('auth.welcome')}</h2>

        <div style={{ flex: 1 }} />

        <Link to="/login" className="btn btn-primary" style={{ marginBottom: 12 }}>
          {t('auth.login')}
        </Link>
        <Link to="/inscription" className="btn btn-outline">
          {t('auth.signup')}
        </Link>

        <div className="demo-box">
          <b>{t('auth.demo')}</b>
          Admin&nbsp;: <code>admin@swisspaints.ch</code> / <code>admin</code>
          <br />
          Ouvrier&nbsp;: <code>ouvrier@swisspaints.ch</code> / <code>ouvrier</code>
          <br />
          RH&nbsp;: <code>rh@swisspaints.ch</code> / <code>rh</code>
          <br />
          Sous-traitant&nbsp;: <code>soustraitant@swisspaints.ch</code> / <code>soustraitant</code>
          <br />
          Comptable&nbsp;: <code>comptable@swisspaints.ch</code> / <code>comptable</code>
          <br />
          Client&nbsp;: <code>client@example.com</code> / <code>client</code>
        </div>
      </div>
    </div>
  )
}

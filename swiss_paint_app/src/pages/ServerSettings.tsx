import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getServerUrl, setServerUrl, ping } from '../data/remote'

export default function ServerSettings() {
  const navigate = useNavigate()
  const { cloud, logout } = useAuth()
  const [url, setUrl] = useState(getServerUrl())
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'ko'>('idle')

  async function test() {
    setStatus('testing')
    const ok = await ping(url)
    setStatus(ok ? 'ok' : 'ko')
  }

  async function connect() {
    setStatus('testing')
    const ok = await ping(url)
    if (!ok) {
      setStatus('ko')
      return
    }
    setServerUrl(url)
    // Passage en mode cloud : reconnexion nécessaire
    logout()
    navigate('/login')
  }

  function disconnect() {
    setServerUrl('')
    localStorage.removeItem('sp_token')
    // Recharge l'app en mode local
    window.location.href = import.meta.env.BASE_URL
  }

  return (
    <Layout title="Connexion serveur" back nav={false}>
      <div className="card">
        <div className="card-title">Mode actuel</div>
        <div className="card-sub" style={{ marginTop: 4 }}>
          {cloud ? (
            <span className="badge badge-green">☁️ Cloud (données partagées)</span>
          ) : (
            <span className="badge badge-gray">📱 Local (cet appareil uniquement)</span>
          )}
        </div>
      </div>

      <div className="info-msg">
        En mode <b>Cloud</b>, les données (pointages, chantiers, devis…) sont partagées entre tous
        les appareils via votre serveur. Collez l'adresse de votre serveur puis reconnectez-vous.
      </div>

      <div className="card">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Adresse du serveur</label>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setStatus('idle')
            }}
            placeholder="https://swisspaints-api.onrender.com"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {status === 'ok' && <div className="success-msg">✓ Serveur joignable.</div>}
        {status === 'ko' && <div className="error-msg">✗ Serveur injoignable. Vérifiez l'adresse.</div>}

        <div className="btn-row">
          <button className="btn btn-outline" onClick={test} disabled={!url || status === 'testing'}>
            {status === 'testing' ? 'Test…' : 'Tester'}
          </button>
          <button className="btn btn-primary" onClick={connect} disabled={!url}>
            Connecter
          </button>
        </div>
      </div>

      {cloud && (
        <button className="btn btn-outline" style={{ color: 'var(--sp-red)' }} onClick={disconnect}>
          Revenir en mode local
        </button>
      )}

      <div className="demo-box" style={{ marginTop: 18 }}>
        <b>Pas encore de serveur ?</b>
        Déployez gratuitement le dossier <code>swiss_paint_backend</code> sur Render (voir le
        fichier README), copiez l'URL fournie (ex&nbsp;: <code>https://…onrender.com</code>) et
        collez-la ci-dessus.
      </div>
    </Layout>
  )
}

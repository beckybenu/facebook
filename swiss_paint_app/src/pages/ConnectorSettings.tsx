import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getConnector, setConnector, clearConnector, pingConnector } from '../lib/connector'

export default function ConnectorSettings() {
  const navigate = useNavigate()
  const existing = getConnector()
  const [url, setUrl] = useState(existing?.url || '')
  const [token, setToken] = useState(existing?.token || '')
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'ko'>('idle')

  async function save() {
    setStatus('testing')
    const ok = await pingConnector({ url: url.trim(), token: token.trim() })
    if (!ok) {
      setStatus('ko')
      return
    }
    setConnector({ url: url.trim(), token: token.trim() })
    setStatus('ok')
    setTimeout(() => navigate('/documents'), 700)
  }

  return (
    <Layout title="Connecteur IA (lecture WD)" back nav={false}>
      <div className="info-msg">
        Le connecteur tourne <b>chez toi</b> (mini-PC / Raspberry Pi) et donne à l'IA l'accès en
        lecture au contenu de tes fichiers WD (PDF, Word, Excel…). Voir le fichier{' '}
        <code>swiss_paint_connector/README.md</code> pour l'installer.
      </div>

      <div className="card">
        <div className="field">
          <label>Adresse du connecteur (HTTPS)</label>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setStatus('idle')
            }}
            placeholder="https://xxxx.trycloudflare.com"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Jeton d'accès (CONNECTOR_TOKEN)</label>
          <input
            type="password"
            value={token}
            onChange={(e) => {
              setToken(e.target.value)
              setStatus('idle')
            }}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {status === 'ok' && <div className="success-msg">✓ Connecteur joignable et connecté.</div>}
        {status === 'ko' && (
          <div className="error-msg">✗ Injoignable. Vérifie que le connecteur tourne et l'adresse/jeton.</div>
        )}

        <button className="btn btn-primary" onClick={save} disabled={!url || status === 'testing'}>
          {status === 'testing' ? 'Test…' : 'Tester et enregistrer'}
        </button>
      </div>

      {existing && (
        <button
          className="btn btn-outline"
          style={{ color: 'var(--sp-red)' }}
          onClick={() => {
            clearConnector()
            navigate(-1)
          }}
        >
          Déconnecter le connecteur
        </button>
      )}
    </Layout>
  )
}

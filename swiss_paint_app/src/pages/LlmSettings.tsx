import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getLlm, setLlm, clearLlm, testLlm, LLM_PRESETS, type LlmConfig } from '../lib/llm'

export default function LlmSettings() {
  const navigate = useNavigate()
  const existing = getLlm()
  const [provider, setProvider] = useState(existing?.provider || 'groq')
  const [apiKey, setApiKey] = useState(existing?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || LLM_PRESETS.groq.baseUrl)
  const [model, setModel] = useState(existing?.model || LLM_PRESETS.groq.model)
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'ko'>('idle')
  const [error, setError] = useState('')

  function pickProvider(p: string) {
    setProvider(p)
    setStatus('idle')
    const preset = LLM_PRESETS[p]
    if (p !== 'custom') {
      setBaseUrl(preset.baseUrl)
      setModel(preset.model)
    }
  }

  const cfg: LlmConfig = { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() }
  const keysUrl = LLM_PRESETS[provider]?.keysUrl

  async function save() {
    setError('')
    setStatus('testing')
    const res = await testLlm(cfg)
    if (!res.ok) {
      setStatus('ko')
      setError(res.error || 'Connexion impossible.')
      return
    }
    setLlm(cfg)
    setStatus('ok')
    setTimeout(() => navigate('/assistant'), 600)
  }

  function disconnect() {
    clearLlm()
    navigate(-1)
  }

  return (
    <Layout title="Connexion IA" back nav={false}>
      <div className="info-msg">
        Sans clé, l'IA reste en veille. Connecte un fournisseur (comme sur ton autre app) : la clé
        est stockée <b>localement dans ce navigateur</b> et n'est envoyée qu'au fournisseur choisi.
        Fonctionne sans serveur.
      </div>

      <div className="card">
        <div className="field">
          <label>Fournisseur</label>
          <select value={provider} onChange={(e) => pickProvider(e.target.value)}>
            {Object.entries(LLM_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {keysUrl && (
          <div className="card-sub" style={{ margin: '4px 0 10px' }}>
            🔑 Obtiens ta clé <b>gratuite</b> sur{' '}
            <a className="link" href={keysUrl} target="_blank" rel="noreferrer">
              {keysUrl.replace('https://', '')}
            </a>
          </div>
        )}

        <div className="field">
          <label>Clé API</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setStatus('idle')
            }}
            placeholder="gsk_..."
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="field">
          <label>URL de base</label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} autoCapitalize="none" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Modèle</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} autoCapitalize="none" />
        </div>

        {status === 'ok' && <div className="success-msg" style={{ marginTop: 12 }}>✓ Connecté !</div>}
        {status === 'ko' && <div className="error-msg" style={{ marginTop: 12 }}>✗ {error}</div>}

        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          onClick={save}
          disabled={!apiKey || !baseUrl || !model || status === 'testing'}
        >
          {status === 'testing' ? 'Test…' : 'Enregistrer'}
        </button>
      </div>

      {existing && (
        <button className="btn btn-outline" style={{ color: 'var(--sp-red)' }} onClick={disconnect}>
          Déconnecter l'IA
        </button>
      )}
    </Layout>
  )
}

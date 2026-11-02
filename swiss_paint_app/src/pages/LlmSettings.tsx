import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getLlm, setLlm, clearLlm, testLlm, listModels, LLM_PRESETS, type LlmConfig } from '../lib/llm'

export default function LlmSettings() {
  const navigate = useNavigate()
  const existing = getLlm()
  const [provider, setProvider] = useState(existing?.provider || 'groq')
  const [apiKey, setApiKey] = useState(existing?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || LLM_PRESETS.groq.baseUrl)
  const [model, setModel] = useState(existing?.model || LLM_PRESETS.groq.model)
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'ko'>('idle')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

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

  async function loadModels() {
    setError('')
    setLoadingModels(true)
    try {
      const list = await listModels(cfg)
      setModels(list)
      // Si le modèle actuel n'est pas dans la liste, on prend le premier disponible
      if (list.length && !list.includes(model)) setModel(list[0])
    } catch (e) {
      setError('Impossible de charger les modèles : ' + (e as Error).message)
    }
    setLoadingModels(false)
  }

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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 1 }}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setStatus('idle')
              }}
              placeholder="gsk_..."
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
              style={{ flexShrink: 0 }}
            >
              {showKey ? '🙈 Masquer' : '👁 Afficher'}
            </button>
          </div>
          {apiKey && (
            <div className="card-sub" style={{ marginTop: 6 }}>
              Clé enregistrée{apiKey.length > 8 ? ` (…${apiKey.slice(-4)})` : ''}.
            </div>
          )}
        </div>
        <div className="field">
          <label>URL de base</label>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} autoCapitalize="none" />
        </div>
        <div className="field" style={{ marginBottom: 6 }}>
          <label>Modèle</label>
          {models.length > 0 ? (
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {(models.includes(model) ? models : [model, ...models]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input value={model} onChange={(e) => setModel(e.target.value)} autoCapitalize="none" />
          )}
          {provider === 'groq' && (
            <div className="card-sub" style={{ marginTop: 6 }}>
              Pour que l'assistant puisse <b>agir</b> (créer un devis, lister…), choisis un modèle qui
              gère les outils, p.&nbsp;ex.{' '}
              <button
                type="button"
                className="link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setModel('llama-3.3-70b-versatile')}
              >
                llama-3.3-70b-versatile
              </button>{' '}
              ou <code>llama-3.1-8b-instant</code>. Sinon il répond mais ne peut pas exécuter d'actions.
            </div>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={loadModels}
          disabled={!apiKey || !baseUrl || loadingModels}
        >
          {loadingModels ? 'Chargement…' : '🔄 Charger les modèles disponibles'}
        </button>

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

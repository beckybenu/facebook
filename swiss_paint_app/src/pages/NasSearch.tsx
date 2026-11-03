import { useState, type FormEvent } from 'react'
import { searchNasDocuments, askNasAi, type NasSearchResult, type NasAiSource } from '../data/remote'

export default function NasSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NasSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [question, setQuestion] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [aiSources, setAiSources] = useState<NasAiSource[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  async function handleAiQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.trim() || aiLoading) return

    setAiLoading(true)
    setAiError('')
    setAiReply('')
    setAiSources([])

    try {
      const response = await askNasAi(question.trim())

      if (!response.ok) {
        setAiError(response.error || 'Assistant IA indisponible.')
      } else {
        setAiReply(response.reply || '')
        setAiSources(response.sources || [])
      }
    } catch {
      setAiError('Impossible de contacter l’assistant IA.')
    } finally {
      setAiLoading(false)
    }
  }


  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError('')
    setResults([])
    setSearched(false)

    try {
      const response = await searchNasDocuments(query.trim())

      if (!response.ok) {
        setError(response.error || 'Recherche impossible.')
      } else {
        setResults(response.results || [])
        setSearched(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h1>Recherche documentaire NAS</h1>
      <p>Recherche dans les documents professionnels SwissPaints.</p>


      <section style={{
        padding: 20,
        marginTop: 24,
        marginBottom: 28,
        border: '1px solid #ccc',
        borderRadius: 10
      }}>
        <h2>Assistant IA privé — Qwen3</h2>
        <p>
          Pose une question sur les documents SwissPaints actuellement indexés.
          Le traitement IA est effectué localement sur ton serveur Ubuntu.
        </p>

        <form onSubmit={handleAiQuestion}
          style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <input
            type="text"
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="Ex. Quels documents concernent la peinture ?"
            maxLength={200}
            aria-label="Question à l'IA privée"
            style={{ flex: 1, minWidth: 0, padding: 12 }}
          />
          <button type="submit" disabled={aiLoading || !question.trim()}>
            {aiLoading ? 'Analyse...' : 'Demander à Qwen3'}
          </button>
        </form>

        {aiError && <p role="alert" style={{ color: 'crimson' }}>{aiError}</p>}

        {aiReply && (
          <div style={{ marginTop: 20 }}>
            <h3>Réponse de l'IA</h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {aiReply}
            </p>

            <h3>Documents consultés ({aiSources.length})</h3>
            {aiSources.map(source => (
              <div key={`${source.numero}-${source.path}`}
                style={{ padding: 10, borderBottom: '1px solid #ddd', overflowWrap: 'anywhere' }}>
                <strong>Source {source.numero} :</strong>{' '}
                {source.path.split('/').pop()}
                <p style={{ margin: '4px 0' }}>{source.reference}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Ex. peinture, facture, chantier..."
          maxLength={200}
          aria-label="Mots-clés"
          style={{ flex: 1, minWidth: 0, padding: 12 }}
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

      {searched && (
        <p style={{ marginTop: 20 }}>
          {results.length} résultat(s) affiché(s).
        </p>
      )}

      {results.map((result, index) => (
        <article
          key={`${result.path}-${result.reference}-${index}`}
          style={{
            padding: 16,
            marginTop: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
            overflowWrap: 'anywhere'
          }}
        >
          <h2 style={{ fontSize: 17 }}>
            {result.path.split('/').pop()}
          </h2>
          <p><strong>Emplacement :</strong> {result.reference}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{result.extrait}</p>
        </article>
      ))}
    </main>
  )
}

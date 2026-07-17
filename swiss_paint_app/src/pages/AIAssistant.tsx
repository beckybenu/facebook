import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { aiChat, aiStatus, type ChatMessage } from '../data/remote'

// Reconnaissance vocale du navigateur (dictée)
type SpeechRecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}
function getRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export default function AIAssistant() {
  const { cloud } = useAuth()
  const navigate = useNavigate()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Bonjour 👋 Je suis l'assistant SwissPaints. Je peux vous aider à rédiger un devis, résumer un chantier, écrire un email client, ou répondre à vos questions. Que puis-je faire ?",
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [speak, setSpeak] = useState(false)
  const recRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cloud) aiStatus().then(setAvailable)
    else setAvailable(false)
  }, [cloud])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  function speakText(text: string) {
    if (!speak || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    const res = await aiChat(next)
    setBusy(false)
    if (res.ok && res.reply) {
      setMessages([...next, { role: 'assistant', content: res.reply }])
      speakText(res.reply)
    } else {
      setMessages([...next, { role: 'assistant', content: `⚠️ ${res.error || 'Erreur.'}` }])
    }
  }

  function toggleMic() {
    const Rec = getRecognition()
    if (!Rec) {
      alert("La dictée vocale n'est pas disponible sur ce navigateur.")
      return
    }
    if (listening) {
      recRef.current?.stop()
      return
    }
    const rec = new Rec()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript || ''
      setInput((prev) => (prev ? prev + ' ' : '') + t)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  // États bloquants : pas de serveur, ou IA non configurée
  if (!cloud) {
    return (
      <Layout title="Assistant IA">
        <div className="info-msg">
          L'assistant IA nécessite un serveur connecté. Va dans <b>Profil → Connexion serveur</b>
          pour activer le mode Cloud.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/parametres')}>
          Connexion serveur
        </button>
      </Layout>
    )
  }
  if (available === false) {
    return (
      <Layout title="Assistant IA">
        <div className="info-msg">
          L'assistant IA n'est pas encore activé sur ton serveur. Ajoute la clé{' '}
          <code>ANTHROPIC_API_KEY</code> dans les variables d'environnement du serveur (voir le
          README du backend), puis redémarre-le.
        </div>
      </Layout>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Retour">
          ‹
        </button>
        <h1>Assistant IA ✨</h1>
        <button
          className="icon-btn"
          onClick={() => setSpeak((s) => !s)}
          aria-label="Lecture vocale"
          title={speak ? 'Lecture vocale activée' : 'Lecture vocale désactivée'}
        >
          {speak ? '🔊' : '🔇'}
        </button>
      </header>

      <main className="app-content no-nav" style={{ paddingBottom: 96 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: '82%',
                padding: '10px 14px',
                borderRadius: 14,
                whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? 'var(--sp-red)' : '#fff',
                color: m.role === 'user' ? '#fff' : 'var(--sp-black)',
                boxShadow: 'var(--shadow)',
                fontSize: 14,
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="muted" style={{ fontSize: 13 }}>
            L'assistant réfléchit…
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Barre de saisie fixe */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 'var(--maxw)',
          background: '#fff',
          borderTop: '1px solid var(--sp-border)',
          padding: 10,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          className="icon-btn"
          onClick={toggleMic}
          aria-label="Dicter"
          style={{ background: listening ? 'var(--sp-red)' : 'var(--sp-gray-light)', color: listening ? '#fff' : 'inherit' }}
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={listening ? 'Parlez…' : 'Écrivez ou dictez…'}
          style={{
            flex: 1,
            border: '1.5px solid var(--sp-border)',
            borderRadius: 20,
            padding: '10px 14px',
            fontSize: 15,
          }}
        />
        <button className="icon-btn" onClick={() => send(input)} aria-label="Envoyer" disabled={busy}
          style={{ background: 'var(--sp-red)', color: '#fff' }}>
          ➤
        </button>
      </div>
    </div>
  )
}

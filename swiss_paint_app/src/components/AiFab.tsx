import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { aiAsk, llmConfigured, type ChatMessage } from '../lib/llm'
import { aiStatus } from '../data/remote'
import { runAgent } from '../lib/aiAgent'

// Reconnaissance vocale (dictée)
type RecCtor = new () => {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}
function getRec(): RecCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

// Écrans où l'on masque le bouton (auth + écran assistant dédié)
const HIDDEN = ['/', '/login', '/inscription', '/assistant', '/ia-config', '/parametres']

const SCREEN_NAMES: { match: RegExp; name: string }[] = [
  { match: /^\/devis/, name: 'Devis' },
  { match: /^\/chantiers/, name: 'Chantiers' },
  { match: /^\/pointage/, name: 'Pointage' },
  { match: /^\/documents/, name: 'Documents' },
  { match: /^\/admin\/pointages/, name: 'Suivi des heures' },
  { match: /^\/admin/, name: 'Administration' },
  { match: /^\/home/, name: 'Accueil' },
  { match: /^\/profil/, name: 'Profil' },
]

export default function AiFab() {
  const { user, cloud } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<InstanceType<RecCtor> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const path = location.pathname
  const hidden = HIDDEN.some((h) => path === h)
  const isEmploye = user?.role === 'admin' || user?.role === 'ouvrier'
  const screen = SCREEN_NAMES.find((s) => s.match.test(path))?.name

  useEffect(() => {
    if (!open) return
    if (llmConfigured()) {
      setAvailable(true)
      return
    }
    if (cloud) aiStatus().then(setAvailable)
    else setAvailable(false)
  }, [open, cloud])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  if (!user || !isEmploye || hidden) return null

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy || !user) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    if (llmConfigured()) {
      const r = await runAgent(next, { role: user.role, userId: user.id, screen })
      setBusy(false)
      setMessages([...next, { role: 'assistant', content: r.reply }])
      if (r.changed) window.dispatchEvent(new Event('sp:refresh'))
      if (r.navigate) {
        setOpen(false)
        setTimeout(() => navigate(r.navigate as string), 300)
      }
    } else {
      const res = await aiAsk(next)
      setBusy(false)
      setMessages([...next, { role: 'assistant', content: res.ok ? res.reply || '' : `⚠️ ${res.error}` }])
    }
  }

  function toggleMic() {
    const Rec = getRec()
    if (!Rec) return
    if (listening) {
      recRef.current?.stop()
      return
    }
    const rec = new Rec()
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e) => setInput((p) => (p ? p + ' ' : '') + (e.results[0]?.[0]?.transcript || ''))
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Assistant IA">
          ✨
        </button>
      )}

      {/* Fenêtre de chat */}
      {open && (
        <div className="ai-sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="ai-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ai-sheet-head">
              <strong>Assistant ✨{screen ? ` · ${screen}` : ''}</strong>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="ai-sheet-body">
              {available === false ? (
                <div className="info-msg">
                  Connecte d'abord un fournisseur IA (clé Groq gratuite).
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      setOpen(false)
                      navigate('/ia-config')
                    }}
                  >
                    Connecter l'IA
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                  Demandez-moi une action : « crée un devis pour… », « liste les chantiers », « résume mes
                  heures »…
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div className={`ai-bubble ${m.role}`}>{m.content}</div>
                  </div>
                ))
              )}
              {busy && (
                <div className="muted" style={{ fontSize: 12 }}>
                  …
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {available !== false && (
              <div className="ai-sheet-input">
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
                  placeholder="Parlez ou écrivez…"
                />
                <button
                  className="icon-btn"
                  onClick={() => send(input)}
                  disabled={busy}
                  aria-label="Envoyer"
                  style={{ background: 'var(--sp-red)', color: '#fff' }}
                >
                  ➤
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

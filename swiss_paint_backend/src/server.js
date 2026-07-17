// API SwissPaints — Express + JWT + persistance JSON.
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { load, save, collection, uid, DATA_FILE } from './store.js'
import { seedIfEmpty } from './seed.js'
import { aiChat, aiDevis, aiAvailable } from './ai.js'

const JWT_SECRET = process.env.JWT_SECRET || 'swisspaints-dev-secret-change-me'
const PORT = process.env.PORT || 4000

load()
seedIfEmpty()

const app = express()
app.use(cors()) // autorise l'app (GitHub Pages) à appeler l'API
app.use(express.json({ limit: '8mb' })) // 8mb pour les images/documents en dataURL

// ---------- Helpers ----------
const publicUser = (u) => {
  if (!u) return null
  const { password, ...rest } = u
  return rest
}

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Non authentifié.' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = collection('users').find((u) => u.id === payload.id)
    if (!user) return res.status(401).json({ error: 'Compte introuvable.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Session expirée.' })
  }
}

const requireAdmin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Réservé aux administrateurs.' })

// Filtrage des données selon le rôle (équivalent RLS)
function stateForUser(user) {
  const users = collection('users')
  const tasks = collection('tasks')
  const timeEntries = collection('timeEntries')
  const devis = collection('devis')
  const documents = collection('documents')

  const docVisible = (d) =>
    d.visibility === 'public' || d.audience === 'tous' || d.audience === user.role

  if (user.role === 'admin') {
    return {
      users: users.map(publicUser),
      tasks,
      timeEntries,
      devis,
      documents,
    }
  }
  if (user.role === 'ouvrier') {
    return {
      users: [publicUser(user)],
      tasks: tasks.filter((t) => t.assignedUserId === user.id),
      timeEntries: timeEntries.filter((e) => e.userId === user.id),
      devis,
      documents: documents.filter(docVisible),
    }
  }
  // client
  return {
    users: [publicUser(user)],
    tasks: [],
    timeEntries: [],
    devis: [],
    documents: documents.filter(docVisible),
  }
}

// ---------- Santé ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'swisspaints', data: DATA_FILE }))

// ---------- Auth ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = collection('users').find((u) => u.email.toLowerCase() === (email || '').toLowerCase())
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
  }
  res.json({ token: sign(user), user: publicUser(user) })
})

app.post('/api/auth/signup', (req, res) => {
  const b = req.body || {}
  if (!b.email || !b.password) return res.status(400).json({ error: 'Email et mot de passe requis.' })
  const users = collection('users')
  if (users.find((u) => u.email.toLowerCase() === b.email.toLowerCase())) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' })
  }
  // Les comptes admin ne peuvent pas être créés librement
  const role = b.role === 'ouvrier' ? 'ouvrier' : 'client'
  const user = {
    id: uid('usr'),
    email: b.email.trim(),
    password: bcrypt.hashSync(b.password, 8),
    username: (b.username || '').trim(),
    nom: (b.nom || '').trim(),
    prenom: (b.prenom || '').trim(),
    role,
    titre: b.titre || '',
    telephone: b.telephone || '',
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  save()
  res.json({ token: sign(user), user: publicUser(user) })
})

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }))

// État complet filtré (hydratation + polling temps réel)
app.get('/api/state', auth, (req, res) => res.json(stateForUser(req.user)))

// ---------- CRUD générique par collection ----------
function upsert(name, obj, prefix) {
  const list = collection(name)
  if (obj.id) {
    const idx = list.findIndex((x) => x.id === obj.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...obj }
      save()
      return list[idx]
    }
  }
  const created = { ...obj, id: obj.id || uid(prefix), createdAt: obj.createdAt || new Date().toISOString() }
  list.push(created)
  save()
  return created
}

function removeById(name, id) {
  const list = collection(name)
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) {
    list.splice(idx, 1)
    save()
    return true
  }
  return false
}

// Utilisateurs (admin)
app.post('/api/users', auth, requireAdmin, (req, res) => {
  const b = req.body || {}
  const users = collection('users')
  const existing = b.id && users.find((u) => u.id === b.id)
  // Hash du mot de passe uniquement s'il change / est fourni en clair
  let password = existing ? existing.password : ''
  if (b.password && b.password !== existing?.password) password = bcrypt.hashSync(b.password, 8)
  const saved = upsert('users', { ...b, password }, 'usr')
  res.json(publicUser(saved))
})
app.delete('/api/users/:id', auth, requireAdmin, (req, res) => {
  removeById('users', req.params.id)
  res.json({ ok: true })
})

// Chantiers / tâches (admin gère ; ouvrier peut mettre à jour le statut de sa tâche)
app.post('/api/tasks', auth, (req, res) => {
  const b = req.body || {}
  if (req.user.role === 'admin') return res.json(upsert('tasks', b, 'tsk'))
  // ouvrier : uniquement ses propres tâches, sans réassignation
  const task = b.id && collection('tasks').find((t) => t.id === b.id)
  if (!task || task.assignedUserId !== req.user.id) {
    return res.status(403).json({ error: 'Modification non autorisée.' })
  }
  res.json(upsert('tasks', { ...b, assignedUserId: task.assignedUserId }, 'tsk'))
})
app.delete('/api/tasks/:id', auth, requireAdmin, (req, res) => {
  removeById('tasks', req.params.id)
  res.json({ ok: true })
})

// Pointages (propriétaire ou admin)
app.post('/api/timeentries', auth, (req, res) => {
  const b = req.body || {}
  const existing = b.id && collection('timeEntries').find((e) => e.id === b.id)
  const ownerId = existing ? existing.userId : b.userId || req.user.id
  if (req.user.role !== 'admin' && ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Pointage non autorisé.' })
  }
  res.json(upsert('timeEntries', { ...b, userId: ownerId }, 'te'))
})

// Devis (admin / ouvrier)
app.post('/api/devis', auth, (req, res) => {
  if (req.user.role === 'client') return res.status(403).json({ error: 'Non autorisé.' })
  res.json(upsert('devis', req.body || {}, 'dev'))
})
app.delete('/api/devis/:id', auth, (req, res) => {
  if (req.user.role === 'client') return res.status(403).json({ error: 'Non autorisé.' })
  removeById('devis', req.params.id)
  res.json({ ok: true })
})

// Documents (admin)
app.post('/api/documents', auth, requireAdmin, (req, res) => res.json(upsert('documents', req.body || {}, 'doc')))
app.delete('/api/documents/:id', auth, requireAdmin, (req, res) => {
  removeById('documents', req.params.id)
  res.json({ ok: true })
})

// ---------- IA (admin / ouvrier) ----------
const requireEmploye = (req, res, next) =>
  req.user.role === 'admin' || req.user.role === 'ouvrier'
    ? next()
    : res.status(403).json({ error: 'Réservé aux employés.' })

app.get('/api/ai/status', auth, (_req, res) => res.json({ available: aiAvailable() }))

app.post('/api/ai/chat', auth, requireEmploye, async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
  if (messages.length === 0) return res.status(400).json({ error: 'Aucun message.' })
  if (!aiAvailable()) return res.status(503).json({ error: "L'assistant IA n'est pas configuré sur le serveur." })
  try {
    const reply = await aiChat(messages)
    res.json({ reply })
  } catch (e) {
    console.error('AI chat error:', e.message)
    res.status(500).json({ error: "Erreur de l'assistant IA." })
  }
})

app.post('/api/ai/devis', auth, requireEmploye, async (req, res) => {
  const prompt = req.body?.prompt
  if (!prompt) return res.status(400).json({ error: 'Décris les travaux à devis.' })
  if (!aiAvailable()) return res.status(503).json({ error: "L'assistant IA n'est pas configuré sur le serveur." })
  try {
    const devis = await aiDevis(prompt)
    res.json(devis)
  } catch (e) {
    console.error('AI devis error:', e.message)
    res.status(500).json({ error: "Erreur de génération du devis." })
  }
})

app.listen(PORT, () => {
  console.log(`SwissPaints API en écoute sur le port ${PORT}`)
  console.log(`Données : ${DATA_FILE}`)
})

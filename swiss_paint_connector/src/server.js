// Connecteur local SwissPaints — accès EN LECTURE SEULE aux fichiers du WD.
// Sécurité : jeton d'accès obligatoire, chemins confinés aux dossiers racines,
// aucune écriture. À exposer en HTTPS via Cloudflare Tunnel.
//
// Plusieurs dossiers : définis WD_ROOTS avec des chemins séparés par « ; »
//   ex :  set WD_ROOTS=\\CLOUD\Administration;\\CLOUD\Comptable;\\CLOUD\Médias;\\CLOUD\Public
// (WD_ROOT — un seul dossier — reste accepté pour compatibilité.)
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const PORT = process.env.PORT || 8787
const TOKEN = process.env.CONNECTOR_TOKEN || '' // jeton d'accès (obligatoire en prod)
const MAX_BYTES = 20 * 1024 * 1024 // 20 Mo max par fichier
const MAX_TEXT = 20000 // caractères max renvoyés à l'IA

// --- Dossiers racines (un ou plusieurs) -------------------------------------
const rawRoots = (process.env.WD_ROOTS || process.env.WD_ROOT || path.resolve('./wd-files'))
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)

function labelFor(p) {
  const cleaned = p.replace(/[\\/]+$/, '')
  const seg = cleaned.split(/[\\/]/).filter(Boolean).pop()
  return seg || cleaned
}

// ROOTS : liste de { label (nom affiché), real (chemin réel résolu) }
const ROOTS = []
for (const r of rawRoots) {
  let real = r
  try {
    real = fs.realpathSync(r)
  } catch {
    console.warn(`⚠️  Dossier introuvable : ${r} — vérifie le montage du WD.`)
  }
  let label = labelFor(r)
  let uniq = label
  let n = 2
  while (ROOTS.some((x) => x.label.toLowerCase() === uniq.toLowerCase())) uniq = `${label} (${n++})`
  ROOTS.push({ label: uniq, real })
}

const app = express()
app.use(cors()) // autorise l'app (GitHub Pages) à interroger le connecteur

// --- Authentification par jeton ---
app.use((req, res, next) => {
  if (req.path === '/api/health') return next()
  if (!TOKEN) return next() // pas de jeton configuré (mode test) — à éviter en prod
  const h = req.headers.authorization || ''
  if (h === `Bearer ${TOKEN}`) return next()
  return res.status(401).json({ error: 'Jeton invalide.' })
})

const HIDDEN = /(^|\/)\.|node_modules|\$RECYCLE|System Volume/i

// --- Résolution + confinement des chemins (anti path-traversal) -------------
// Un chemin client ressemble à « Administration/Sous-dossier/fichier.xlsx ».
// Le 1er segment désigne le dossier racine ; le reste est relatif à celui-ci.
function resolvePath(rel) {
  const parts = String(rel || '')
    .split(/[\\/]+/)
    .filter((p) => p && p !== '.')
  if (parts.length === 0) return { virtual: true } // racine = liste des dossiers
  const root = ROOTS.find((r) => r.label.toLowerCase() === parts[0].toLowerCase())
  if (!root) throw new Error(`Dossier inconnu : ${parts[0]}`)
  const sub = parts.slice(1).join(path.sep)
  const target = path.resolve(root.real, '.' + path.sep + sub)
  const real = fs.existsSync(target) ? fs.realpathSync(target) : target
  if (real !== root.real && !real.startsWith(root.real + path.sep)) {
    throw new Error('Chemin hors du dossier autorisé.')
  }
  return { virtual: false, real, root }
}

// Chemin client (avec préfixe du dossier racine) à partir d'un chemin absolu
function relOf(root, abs) {
  const inner = path.relative(root.real, abs).split(path.sep).join('/')
  return inner ? `${root.label}/${inner}` : root.label
}

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'swisspaints-connector', roots: ROOTS.map((r) => r.label) })
)

// Lister un dossier (ou la liste des dossiers racines si path vide)
app.get('/api/list', async (req, res) => {
  try {
    const r = resolvePath(req.query.path || '')
    if (r.virtual) {
      const entries = ROOTS.map((root) => ({ name: root.label, path: root.label, type: 'dir', size: 0, mtime: null }))
      return res.json({ path: '', entries })
    }
    const entries = await fsp.readdir(r.real, { withFileTypes: true })
    const out = []
    for (const e of entries) {
      if (HIDDEN.test(e.name)) continue
      const abs = path.join(r.real, e.name)
      let size = 0
      let mtime = null
      try {
        const st = await fsp.stat(abs)
        size = st.size
        mtime = st.mtime.toISOString()
      } catch {
        /* ignore */
      }
      out.push({ name: e.name, path: relOf(r.root, abs), type: e.isDirectory() ? 'dir' : 'file', size, mtime })
    }
    out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))
    res.json({ path: relOf(r.root, r.real), entries: out })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Rechercher un fichier par nom dans TOUS les dossiers racines (récursif, borné)
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  if (!q) return res.json({ results: [] })
  const results = []
  let scanned = 0
  async function walk(root, dir, depth) {
    if (depth > 6 || scanned > 5000 || results.length >= 50) return
    let entries = []
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (HIDDEN.test(e.name)) continue
      scanned++
      const abs = path.join(dir, e.name)
      if (e.name.toLowerCase().includes(q)) {
        results.push({ name: e.name, path: relOf(root, abs), type: e.isDirectory() ? 'dir' : 'file' })
        if (results.length >= 50) return
      }
      if (e.isDirectory()) await walk(root, abs, depth + 1)
    }
  }
  for (const root of ROOTS) {
    if (root.real) await walk(root, root.real, 0)
  }
  res.json({ results })
})

// Extraire le texte d'un fichier (PDF, Word, Excel, texte)
app.get('/api/read', async (req, res) => {
  try {
    const r = resolvePath(req.query.path || '')
    if (r.virtual) return res.status(400).json({ error: 'Précise un fichier à lire.' })
    const abs = r.real
    const st = await fsp.stat(abs)
    if (st.isDirectory()) return res.status(400).json({ error: "C'est un dossier, pas un fichier." })
    if (st.size > MAX_BYTES) return res.status(413).json({ error: 'Fichier trop volumineux (>20 Mo).' })

    const ext = path.extname(abs).toLowerCase()
    let text = ''
    if (['.txt', '.md', '.csv', '.log', '.json', '.xml', '.html'].includes(ext)) {
      text = await fsp.readFile(abs, 'utf-8')
    } else if (ext === '.pdf') {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
      text = (await pdfParse(await fsp.readFile(abs))).text
    } else if (ext === '.docx') {
      const mammoth = (await import('mammoth')).default
      text = (await mammoth.extractRawText({ path: abs })).value
    } else if (['.xlsx', '.xls'].includes(ext)) {
      const XLSX = (await import('xlsx')).default
      const wb = XLSX.readFile(abs)
      text = wb.SheetNames.map((n) => `# ${n}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n')
    } else {
      return res.json({ name: path.basename(abs), path: relOf(r.root, abs), text: '', unsupported: true })
    }

    const truncated = text.length > MAX_TEXT
    res.json({ name: path.basename(abs), path: relOf(r.root, abs), text: text.slice(0, MAX_TEXT), truncated })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Connecteur SwissPaints en écoute sur le port ${PORT}`)
  console.log(`Dossiers WD (${ROOTS.length}) : ${ROOTS.map((r) => r.label).join(', ')}`)
  if (!TOKEN) console.warn('⚠️  Aucun CONNECTOR_TOKEN défini — ajoute-en un en production.')
})

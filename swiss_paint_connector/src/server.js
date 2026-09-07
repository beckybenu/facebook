// Connecteur local SwissPaints — accès EN LECTURE SEULE aux fichiers du WD.
// Sécurité : jeton d'accès obligatoire, chemins confinés au dossier racine,
// aucune écriture. À exposer en HTTPS via Cloudflare Tunnel.
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const PORT = process.env.PORT || 8787
// Dossier racine = point de montage de ton partage WD (ex : /mnt/wd)
const WD_ROOT = process.env.WD_ROOT || path.resolve('./wd-files')
const TOKEN = process.env.CONNECTOR_TOKEN || '' // jeton d'accès (obligatoire en prod)
const MAX_BYTES = 20 * 1024 * 1024 // 20 Mo max par fichier
const MAX_TEXT = 20000 // caractères max renvoyés à l'IA

let ROOT_REAL = WD_ROOT
try {
  ROOT_REAL = fs.realpathSync(WD_ROOT)
} catch {
  console.warn(`⚠️  Dossier racine introuvable : ${WD_ROOT} — vérifie le montage du WD.`)
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

// --- Confinement des chemins (anti path-traversal) ---
function safeResolve(rel) {
  const target = path.resolve(ROOT_REAL, '.' + path.sep + (rel || ''))
  const real = fs.existsSync(target) ? fs.realpathSync(target) : target
  if (real !== ROOT_REAL && !real.startsWith(ROOT_REAL + path.sep)) {
    throw new Error('Chemin hors du dossier autorisé.')
  }
  return real
}
const rel = (abs) => path.relative(ROOT_REAL, abs).split(path.sep).join('/')

const HIDDEN = /(^|\/)\.|node_modules|\$RECYCLE|System Volume/i

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'swisspaints-connector', root: ROOT_REAL }))

// Lister un dossier
app.get('/api/list', async (req, res) => {
  try {
    const dir = safeResolve(req.query.path || '')
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    const out = []
    for (const e of entries) {
      if (HIDDEN.test(e.name)) continue
      const abs = path.join(dir, e.name)
      let size = 0
      let mtime = null
      try {
        const st = await fsp.stat(abs)
        size = st.size
        mtime = st.mtime.toISOString()
      } catch {
        /* ignore */
      }
      out.push({ name: e.name, path: rel(abs), type: e.isDirectory() ? 'dir' : 'file', size, mtime })
    }
    out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1))
    res.json({ path: rel(dir), entries: out })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Rechercher un fichier par nom (récursif, borné)
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim()
  if (!q) return res.json({ results: [] })
  const results = []
  let scanned = 0
  async function walk(dir, depth) {
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
        results.push({ name: e.name, path: rel(abs), type: e.isDirectory() ? 'dir' : 'file' })
        if (results.length >= 50) return
      }
      if (e.isDirectory()) await walk(abs, depth + 1)
    }
  }
  await walk(ROOT_REAL, 0)
  res.json({ results })
})

// Extraire le texte d'un fichier (PDF, Word, Excel, texte)
app.get('/api/read', async (req, res) => {
  try {
    const abs = safeResolve(req.query.path || '')
    const st = await fsp.stat(abs)
    if (st.isDirectory()) return res.status(400).json({ error: "C'est un dossier, pas un fichier." })
    if (st.size > MAX_BYTES) return res.status(413).json({ error: 'Fichier trop volumineux (>20 Mo).' })

    const ext = path.extname(abs).toLowerCase()
    let text = ''
    if (['.txt', '.md', '.csv', '.log', '.json', '.xml', '.html'].includes(ext)) {
      text = await fsp.readFile(abs, 'utf-8')
    } else if (ext === '.pdf') {
      // import du fichier lib pour éviter le code de test de pdf-parse
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
      return res.json({ name: path.basename(abs), path: rel(abs), text: '', unsupported: true })
    }

    const truncated = text.length > MAX_TEXT
    res.json({
      name: path.basename(abs),
      path: rel(abs),
      text: text.slice(0, MAX_TEXT),
      truncated,
    })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Connecteur SwissPaints en écoute sur le port ${PORT}`)
  console.log(`Dossier WD : ${ROOT_REAL}`)
  if (!TOKEN) console.warn('⚠️  Aucun CONNECTOR_TOKEN défini — ajoute-en un en production.')
})

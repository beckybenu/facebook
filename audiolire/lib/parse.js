// Import de livres : TXT / MD / HTML / PDF / EPUB -> texte brut.
// Les librairies lourdes (pdf.js, JSZip) sont chargées à la demande.

// Librairies embarquées (aucun appel réseau : l'app fonctionne hors ligne).
const PDFJS_URL = new URL('../vendor/pdf.min.mjs', import.meta.url).href;
const PDFJS_WORKER = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
const JSZIP_URL = new URL('../vendor/jszip.min.js', import.meta.url).href;

let pdfjsLib = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(PDFJS_URL);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjsLib;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = url;
    el.onload = resolve;
    el.onerror = () => reject(new Error('Chargement impossible : ' + url));
    document.head.appendChild(el);
  });
}

async function loadJsZip() {
  if (!window.JSZip) await loadScript(JSZIP_URL);
  return window.JSZip;
}

// --- Nettoyage -------------------------------------------------------------

// Recolle les mots coupés en fin de ligne, fusionne les lignes d'un même
// paragraphe (fréquent dans les PDF) et normalise les espaces.
function cleanText(raw) {
  let t = raw
    .replace(/\r\n?/g, '\n')
    .replace(/­/g, '')            // trait d'union conditionnel
    .replace(/[\t   ]/g, ' ')
    .replace(/(\p{Ll})-[ ]*\n[ ]*(\p{Ll})/gu, '$1$2')  // « exem-\nple » -> « exemple »
    .replace(/[ ]{2,}/g, ' ');
  // Une simple fin de ligne à l'intérieur d'un paragraphe devient une espace.
  t = t.replace(/([^\n.!?:;»"”\)\]])\n(?=\p{Ll})/gu, '$1 ');
  return t.replace(/\n{3,}/g, '\n\n').split('\n').map(l => l.trim()).join('\n').trim();
}

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, nav, header, footer').forEach(n => n.remove());
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, br, div, tr').forEach(n => {
    n.appendChild(doc.createTextNode('\n'));
  });
  return cleanText(doc.body ? doc.body.textContent : '');
}

// --- Formats ---------------------------------------------------------------

async function parsePdf(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let out = '';
    let lastY = null;
    let lineHeight = null;   // plus petit écart vertical observé ≈ interligne

    for (const item of content.items) {
      if (typeof item.str !== 'string') continue;   // éléments de balisage
      const y = item.transform ? item.transform[5] : null;

      if (lastY !== null && y !== null) {
        const gap = Math.abs(y - lastY);
        if (gap > 1) {
          if (lineHeight === null || gap < lineHeight) lineHeight = gap;
          // Un saut vertical nettement plus grand qu'un interligne = paragraphe.
          const isParagraph = gap > lineHeight * 1.5;
          if (!out.endsWith('\n\n')) out += out.endsWith('\n') ? (isParagraph ? '\n' : '') : (isParagraph ? '\n\n' : '\n');
        }
      }

      out += item.str;
      if (item.hasEOL && !out.endsWith('\n')) out += '\n';
      if (y !== null) lastY = y;
    }
    pages.push(out);
    onProgress?.(i / pdf.numPages);
  }
  // Une phrase coupée par un saut de page ne doit pas devenir un paragraphe.
  const joined = pages.reduce((acc, page) => {
    if (!acc) return page;
    const continues = /[^.!?…»"”\)\]]\s*$/.test(acc);
    return acc + (continues ? '\n' : '\n\n') + page;
  }, '');

  const meta = await pdf.getMetadata().catch(() => null);
  return {
    text: cleanText(joined),
    title: meta?.info?.Title?.trim() || null,
    author: meta?.info?.Author?.trim() || null,
  };
}

async function parseEpub(file, onProgress) {
  const JSZip = await loadJsZip();
  const zip = await JSZip.loadAsync(file);

  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) throw new Error('EPUB invalide (container.xml manquant)');
  const container = new DOMParser().parseFromString(await containerFile.async('string'), 'application/xml');
  const opfPath = container.querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath) throw new Error('EPUB invalide (fichier OPF introuvable)');

  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const opf = new DOMParser().parseFromString(await zip.file(opfPath).async('string'), 'application/xml');

  const manifest = {};
  opf.querySelectorAll('manifest > item').forEach(item => {
    manifest[item.getAttribute('id')] = item.getAttribute('href');
  });
  const spine = [...opf.querySelectorAll('spine > itemref')]
    .map(ref => manifest[ref.getAttribute('idref')])
    .filter(Boolean);

  const parts = [];
  for (let i = 0; i < spine.length; i++) {
    const path = decodeURIComponent(new URL(spine[i], 'file:///' + base).pathname.slice(1));
    const entry = zip.file(path) || zip.file(base + spine[i]);
    if (!entry) continue;
    const text = htmlToText(await entry.async('string'));
    if (text) parts.push(text);
    onProgress?.((i + 1) / spine.length);
  }

  const get = tag => opf.getElementsByTagName('dc:' + tag)[0]?.textContent?.trim() || null;
  return {
    text: cleanText(parts.join('\n\n')),
    title: get('title'),
    author: get('creator'),
    lang: get('language'),
  };
}

// --- Détection de langue ---------------------------------------------------

// Détection par mots-outils : suffisant pour préselectionner une voix.
const STOPWORDS = {
  fr: ['le', 'la', 'les', 'des', 'une', 'dans', 'que', 'qui', 'pour', 'pas', 'plus', 'est', 'avec', 'sur', 'elle'],
  en: ['the', 'and', 'that', 'was', 'with', 'for', 'his', 'her', 'not', 'they', 'this', 'from', 'you', 'have'],
  es: ['que', 'los', 'las', 'del', 'una', 'con', 'por', 'para', 'como', 'pero', 'más', 'muy', 'ella', 'sus'],
  de: ['der', 'die', 'und', 'das', 'ist', 'nicht', 'mit', 'sich', 'auf', 'von', 'ein', 'eine', 'war', 'auch'],
  it: ['che', 'non', 'per', 'una', 'con', 'del', 'sono', 'come', 'della', 'più', 'anche', 'gli', 'era', 'nel'],
  pt: ['que', 'não', 'uma', 'com', 'por', 'para', 'como', 'mais', 'dos', 'das', 'ele', 'ela', 'foi', 'seu'],
  nl: ['het', 'een', 'van', 'dat', 'niet', 'zijn', 'met', 'voor', 'maar', 'ook', 'aan', 'als', 'werd', 'haar'],
};

export function detectLanguage(text) {
  const words = text.slice(0, 40000).toLowerCase().match(/\p{L}+/gu) || [];
  if (words.length < 20) return null;
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  let best = null;
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const score = list.reduce((sum, w) => sum + (counts.get(w) || 0), 0);
    if (score > bestScore) { bestScore = score; best = lang; }
  }
  return bestScore / words.length > 0.01 ? best : null;
}

// --- Entrée publique -------------------------------------------------------

export async function parseBook(file, onProgress) {
  const name = file.name || 'Sans titre';
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  let parsed;

  if (ext === 'pdf') parsed = await parsePdf(file, onProgress);
  else if (ext === 'epub') parsed = await parseEpub(file, onProgress);
  else if (ext === 'html' || ext === 'htm' || ext === 'xhtml') parsed = { text: htmlToText(await file.text()) };
  else parsed = { text: cleanText(await file.text()) };

  const text = parsed.text || '';
  if (!text.trim()) {
    throw new Error(ext === 'pdf'
      ? 'Aucun texte extractible : ce PDF est probablement un scan (image).'
      : 'Aucun texte trouvé dans ce fichier.');
  }

  return {
    id: crypto.randomUUID(),
    title: parsed.title || name.replace(/\.[^.]+$/, ''),
    author: parsed.author || null,
    format: ext,
    lang: (parsed.lang || detectLanguage(text) || navigator.language || 'fr').slice(0, 2),
    text,
    chars: text.length,
    sentenceIndex: 0,
    sentenceCount: 0,
    addedAt: Date.now(),
    openedAt: Date.now(),
  };
}

export const SUPPORTED = '.txt,.md,.text,.html,.htm,.xhtml,.pdf,.epub';

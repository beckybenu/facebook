import { db, makePositionSaver } from './lib/db.js';
import { parseBook, SUPPORTED } from './lib/parse.js';
import { segment, findSentenceAt, SpeechEngine } from './lib/reader.js';

// ---------------------------------------------------------------- i18n -----

const I18N = {
  fr: {
    import: 'Importer un livre', libTitle: 'Votre bibliothèque',
    libHint: 'Glissez vos fichiers ici — PDF, EPUB, TXT, MD ou HTML. Tout reste sur votre appareil.',
    chooseFile: 'Choisir un fichier', myBooks: 'Mes livres', voiceSettings: 'Voix et vitesse',
    bookLang: 'Langue du livre', voice: 'Voix', speed: 'Vitesse', pitch: 'Tonalité', volume: 'Volume',
    highlightWords: 'Surligner les mots pendant la lecture', autoScroll: 'Suivre le texte automatiquement',
    search: 'Rechercher un passage', searchPh: 'Mot ou phrase…',
    footer: '100 % local : vos livres ne quittent jamais votre navigateur. Synthèse vocale fournie par votre système.',
    sentences: 'phrases', finished: 'Terminé', noVoice: 'Aucune voix installée pour cette langue — le système utilisera sa voix par défaut.',
    results: n => `${n} passage${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}`,
    noResult: 'Aucun passage trouvé.', importing: 'Import en cours…', reading: 'Lecture du fichier…',
    added: t => `« ${t} » ajouté à la bibliothèque`, deleted: 'Livre supprimé',
    confirmDelete: t => `Supprimer « ${t} » de la bibliothèque ?`,
    endOfBook: 'Fin du livre 🎉', page: (a, b) => `Page ${a} / ${b}`,
    unsupported: 'La synthèse vocale n’est pas disponible dans ce navigateur.',
    empty: 'Aucun livre pour l’instant.',
  },
  en: {
    import: 'Import a book', libTitle: 'Your library',
    libHint: 'Drop your files here — PDF, EPUB, TXT, MD or HTML. Everything stays on your device.',
    chooseFile: 'Choose a file', myBooks: 'My books', voiceSettings: 'Voice & speed',
    bookLang: 'Book language', voice: 'Voice', speed: 'Speed', pitch: 'Pitch', volume: 'Volume',
    highlightWords: 'Highlight words while reading', autoScroll: 'Follow the text automatically',
    search: 'Search a passage', searchPh: 'Word or phrase…',
    footer: '100% local: your books never leave your browser. Speech provided by your system.',
    sentences: 'sentences', finished: 'Finished', noVoice: 'No voice installed for this language — the system default will be used.',
    results: n => `${n} passage${n > 1 ? 's' : ''} found`,
    noResult: 'No passage found.', importing: 'Importing…', reading: 'Reading file…',
    added: t => `“${t}” added to your library`, deleted: 'Book deleted',
    confirmDelete: t => `Delete “${t}” from your library?`,
    endOfBook: 'End of book 🎉', page: (a, b) => `Page ${a} / ${b}`,
    unsupported: 'Speech synthesis is not available in this browser.',
    empty: 'No books yet.',
  },
  es: {
    import: 'Importar un libro', libTitle: 'Tu biblioteca',
    libHint: 'Arrastra tus archivos aquí — PDF, EPUB, TXT, MD o HTML. Todo permanece en tu dispositivo.',
    chooseFile: 'Elegir un archivo', myBooks: 'Mis libros', voiceSettings: 'Voz y velocidad',
    bookLang: 'Idioma del libro', voice: 'Voz', speed: 'Velocidad', pitch: 'Tono', volume: 'Volumen',
    highlightWords: 'Resaltar las palabras al leer', autoScroll: 'Seguir el texto automáticamente',
    search: 'Buscar un pasaje', searchPh: 'Palabra o frase…',
    footer: '100 % local: tus libros nunca salen del navegador. Voz proporcionada por tu sistema.',
    sentences: 'frases', finished: 'Terminado', noVoice: 'No hay voz instalada para este idioma — se usará la predeterminada.',
    results: n => `${n} pasaje${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''}`,
    noResult: 'Ningún pasaje encontrado.', importing: 'Importando…', reading: 'Leyendo el archivo…',
    added: t => `«${t}» añadido a la biblioteca`, deleted: 'Libro eliminado',
    confirmDelete: t => `¿Eliminar «${t}» de la biblioteca?`,
    endOfBook: 'Fin del libro 🎉', page: (a, b) => `Página ${a} / ${b}`,
    unsupported: 'La síntesis de voz no está disponible en este navegador.',
    empty: 'Todavía no hay libros.',
  },
  de: {
    import: 'Buch importieren', libTitle: 'Deine Bibliothek',
    libHint: 'Dateien hierher ziehen — PDF, EPUB, TXT, MD oder HTML. Alles bleibt auf deinem Gerät.',
    chooseFile: 'Datei auswählen', myBooks: 'Meine Bücher', voiceSettings: 'Stimme & Tempo',
    bookLang: 'Sprache des Buches', voice: 'Stimme', speed: 'Tempo', pitch: 'Tonhöhe', volume: 'Lautstärke',
    highlightWords: 'Wörter beim Lesen hervorheben', autoScroll: 'Text automatisch mitführen',
    search: 'Textstelle suchen', searchPh: 'Wort oder Satz…',
    footer: '100 % lokal: Deine Bücher verlassen den Browser nie. Sprachausgabe von deinem System.',
    sentences: 'Sätze', finished: 'Fertig', noVoice: 'Keine Stimme für diese Sprache installiert — Standardstimme wird verwendet.',
    results: n => `${n} Stelle${n > 1 ? 'n' : ''} gefunden`,
    noResult: 'Nichts gefunden.', importing: 'Import läuft…', reading: 'Datei wird gelesen…',
    added: t => `„${t}“ hinzugefügt`, deleted: 'Buch gelöscht',
    confirmDelete: t => `„${t}“ wirklich löschen?`,
    endOfBook: 'Ende des Buches 🎉', page: (a, b) => `Seite ${a} / ${b}`,
    unsupported: 'Sprachausgabe ist in diesem Browser nicht verfügbar.',
    empty: 'Noch keine Bücher.',
  },
};

let uiLang = 'fr';
const t = (key, ...args) => {
  const dict = I18N[uiLang] || I18N.fr;
  const value = dict[key] ?? I18N.fr[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
};

function applyI18n() {
  document.documentElement.lang = uiLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  if (state.book) renderPager();
}

// --------------------------------------------------------------- outils ----

const $ = id => document.getElementById(id);
const PAGE_SIZE = 300;                // phrases affichées par page
const LANGS = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'ar', 'zh', 'ja', 'ko', 'pl', 'sv', 'tr', 'hi'];
const LANG_NAMES = new Intl.DisplayNames(['fr'], { type: 'language' });

const ACCENTS = { à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', ç: 'c', è: 'e', é: 'e', ê: 'e', ë: 'e', ì: 'i', í: 'i', î: 'i', ï: 'i', ñ: 'n', ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ù: 'u', ú: 'u', û: 'u', ü: 'u', ý: 'y', ÿ: 'y', œ: 'e', æ: 'a' };
// Normalisation qui conserve la longueur : les décalages restent valides.
const fold = s => s.toLowerCase().replace(/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿœæ]/g, c => ACCENTS[c]);

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ---------------------------------------------------------------- état -----

const engine = new SpeechEngine();
const saver = makePositionSaver();

const state = {
  book: null,
  sentences: [],
  searchText: '',
  page: 0,
  spans: [],          // spans rendus pour la page courante, indexés par phrase
  currentEl: null,
  settings: { rate: 1, pitch: 1, volume: 1, voiceByLang: {}, highlightWords: true, autoScroll: true, uiLang: null },
};

// ---------------------------------------------------------- bibliothèque ---

function progressOf(book) {
  if (!book.sentenceCount) return 0;
  return Math.min(100, Math.round((book.sentenceIndex / book.sentenceCount) * 100));
}

async function renderLibrary() {
  const books = (await db.allBooks()).sort((a, b) => b.openedAt - a.openedAt);
  const grid = $('bookGrid');
  grid.textContent = '';
  $('shelf').hidden = books.length === 0;
  document.body.classList.toggle('has-books', books.length > 0);

  for (const book of books) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="card-cover"><span>${book.format.toUpperCase()}</span></div>
      <div class="card-body">
        <h3></h3>
        <p class="card-author"></p>
        <div class="card-progress"><div style="width:${progressOf(book)}%"></div></div>
        <p class="card-meta">${progressOf(book)} % · ${book.sentenceCount || '—'} ${t('sentences')} · ${book.lang.toUpperCase()}</p>
      </div>
      <button class="card-del" type="button" title="Supprimer" aria-label="Supprimer">🗑</button>`;
    card.querySelector('h3').textContent = book.title;
    card.querySelector('.card-author').textContent = book.author || '';

    card.addEventListener('click', e => {
      if (e.target.closest('.card-del')) return;
      openBook(book.id);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(book.id); }
    });
    card.querySelector('.card-del').addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(t('confirmDelete', book.title))) return;
      await db.deleteBook(book.id);
      toast(t('deleted'));
      renderLibrary();
    });
    grid.appendChild(card);
  }
}

// -------------------------------------------------------------- import -----

async function importFiles(files) {
  const loader = $('loader');
  loader.hidden = false;
  let last = null;
  try {
    for (const file of files) {
      $('loaderText').textContent = `${t('reading')} ${file.name}`;
      $('loaderBar').style.width = '5%';
      try {
        const book = await parseBook(file, p => { $('loaderBar').style.width = `${Math.round(p * 100)}%`; });
        book.sentenceCount = segment(book.text, book.lang).length;
        await db.putBook(book);
        last = book;
      } catch (err) {
        toast(`${file.name} : ${err.message}`);
      }
    }
  } finally {
    loader.hidden = true;
    $('loaderBar').style.width = '0%';
  }
  await renderLibrary();
  if (last) {
    toast(t('added', last.title));
    openBook(last.id);
  }
}

// -------------------------------------------------------------- lecteur ----

async function openBook(id) {
  const book = await db.getBook(id);
  if (!book) return;

  state.book = book;
  state.sentences = segment(book.text, book.lang);
  state.searchText = '';
  book.sentenceCount = state.sentences.length;
  book.openedAt = Date.now();
  db.putBook({ ...book });

  $('bookTitle').textContent = book.title;
  $('bookMeta').textContent = [book.author, `${state.sentences.length} ${t('sentences')}`,
    `${Math.round(book.chars / 1000)} k`].filter(Boolean).join(' · ');

  $('libraryView').hidden = true;
  $('readerView').hidden = false;
  $('seekBar').max = Math.max(1, state.sentences.length - 1);

  const index = Math.min(book.sentenceIndex || 0, state.sentences.length - 1);
  engine.load(book.text, state.sentences, index);
  engine.lang = book.lang;
  applyVoiceForLang(book.lang);
  $('langSelect').value = book.lang;

  showPageFor(index);
  setCurrent(index, false);
  updateProgress(index);
}

async function closeBook() {
  engine.stop();
  await saver.flush();
  state.book = null;
  state.sentences = [];
  state.spans = [];
  $('readerView').hidden = true;
  $('libraryView').hidden = false;
  renderLibrary();
}

function pageOf(index) {
  return Math.floor(index / PAGE_SIZE);
}

function renderPager() {
  const pages = Math.ceil(state.sentences.length / PAGE_SIZE) || 1;
  $('pager').hidden = pages < 2;
  $('pageLabel').textContent = t('page', state.page + 1, pages);
  $('prevPage').disabled = state.page === 0;
  $('nextPage').disabled = state.page >= pages - 1;
}

// Rendu d'une fenêtre de phrases : les livres font parfois des millions de
// caractères, on n'insère dans le DOM que la page courante.
function showPageFor(index) {
  const page = pageOf(index);
  if (state.spans.length && page === state.page) return;
  state.page = page;

  const pane = $('textPane');
  pane.textContent = '';
  state.spans = [];
  state.currentEl = null;

  const from = page * PAGE_SIZE;
  const to = Math.min(state.sentences.length, from + PAGE_SIZE);
  const frag = document.createDocumentFragment();
  let para = null;
  let paraId = -1;

  for (let i = from; i < to; i++) {
    const sentence = state.sentences[i];
    if (sentence.para !== paraId) {
      para = document.createElement('p');
      frag.appendChild(para);
      paraId = sentence.para;
    }
    const span = document.createElement('span');
    span.className = 'sent';
    span.dataset.i = i;
    span.textContent = state.book.text.slice(sentence.start, sentence.end);
    para.appendChild(span);
    para.appendChild(document.createTextNode(' '));
    state.spans[i] = span;
  }
  pane.appendChild(frag);
  renderPager();
}

function clearWordHighlight(el) {
  if (el && el.querySelector('mark')) {
    el.textContent = el.dataset.plain || el.textContent;
  }
}

function setCurrent(index, scroll = true) {
  showPageFor(index);
  const el = state.spans[index];
  if (state.currentEl && state.currentEl !== el) {
    clearWordHighlight(state.currentEl);
    state.currentEl.classList.remove('cur');
  }
  if (!el) return;
  el.classList.add('cur');
  el.dataset.plain = el.textContent;
  state.currentEl = el;
  if (scroll && state.settings.autoScroll) scrollToCurrent(el);
}

function scrollToCurrent(el) {
  const pane = $('textPane');
  const paneRect = pane.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const comfortTop = paneRect.top + paneRect.height * 0.25;
  const comfortBottom = paneRect.top + paneRect.height * 0.75;
  if (rect.top < paneRect.top || rect.bottom > paneRect.bottom) {
    pane.scrollTop += rect.top - comfortTop;
  } else if (rect.top > comfortBottom) {
    pane.scrollTo({ top: pane.scrollTop + rect.top - comfortTop, behavior: 'smooth' });
  }
}

// Surligne le mot en cours à l'intérieur de la phrase courante.
function highlightWord(absOffset, length) {
  const el = state.currentEl;
  if (!el || !state.settings.highlightWords) return;
  const sentence = state.sentences[engine.index];
  if (!sentence) return;

  const plain = el.dataset.plain || el.textContent;
  let start = absOffset - sentence.start;
  if (start < 0 || start >= plain.length) return;
  let end = length ? start + length : start;
  if (!length) {
    const match = /^[\p{L}\p{N}'’-]+/u.exec(plain.slice(start));
    end = start + (match ? match[0].length : 1);
  }

  el.textContent = '';
  el.appendChild(document.createTextNode(plain.slice(0, start)));
  const mark = document.createElement('mark');
  mark.textContent = plain.slice(start, end);
  el.appendChild(mark);
  el.appendChild(document.createTextNode(plain.slice(end)));
}

function updateProgress(index) {
  const total = state.sentences.length;
  $('seekBar').value = index;
  $('posLabel').textContent = total ? `${Math.round((index / Math.max(1, total - 1)) * 100)} %` : '0 %';
}

// ---------------------------------------------------------------- voix -----

let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices() || [];
  renderVoiceOptions();
}

function renderVoiceOptions() {
  const lang = $('langSelect').value || 'fr';
  const select = $('voiceSelect');
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  const others = voices.filter(v => !matching.includes(v));

  select.textContent = '';
  const addGroup = (label, list) => {
    if (!list.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    for (const v of list) {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})${v.localService ? '' : ' ☁'}`;
      group.appendChild(opt);
    }
    select.appendChild(group);
  };
  addGroup(lang.toUpperCase(), matching);
  addGroup('…', others);

  $('voiceHint').textContent = matching.length ? '' : t('noVoice');

  const wanted = state.settings.voiceByLang[lang];
  const chosen = voices.find(v => v.voiceURI === wanted) || matching[0] || voices[0] || null;
  if (chosen) select.value = chosen.voiceURI;
  engine.voice = chosen;
  engine.lang = lang;
}

function applyVoiceForLang(lang) {
  $('langSelect').value = lang;
  renderVoiceOptions();
}

// -------------------------------------------------------------- recherche --

function runSearch(query) {
  const box = $('searchResults');
  box.textContent = '';
  const q = fold(query.trim());
  if (!state.book || q.length < 2) { $('searchCount').textContent = ''; return; }

  if (!state.searchText) state.searchText = fold(state.book.text);

  const MAX = 300;
  const hits = [];
  let from = 0;
  let capped = false;
  for (;;) {
    const at = state.searchText.indexOf(q, from);
    if (at === -1) break;
    if (hits.length === MAX) { capped = true; break; }
    hits.push(at);
    from = at + q.length;
  }

  $('searchCount').textContent = hits.length
    ? t('results', hits.length) + (capped ? ' +' : '')
    : t('noResult');

  for (const at of hits) {
    const index = findSentenceAt(state.sentences, at);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'result';
    const before = state.book.text.slice(Math.max(0, at - 60), at);
    const hit = state.book.text.slice(at, at + q.length);
    const after = state.book.text.slice(at + q.length, at + q.length + 80);

    item.appendChild(document.createTextNode('…' + before));
    const mark = document.createElement('mark');
    mark.textContent = hit;
    item.appendChild(mark);
    item.appendChild(document.createTextNode(after + '…'));

    const pos = document.createElement('span');
    pos.className = 'result-pos';
    pos.textContent = `${Math.round((index / Math.max(1, state.sentences.length - 1)) * 100)} %`;
    item.appendChild(pos);

    item.addEventListener('click', () => {
      engine.seek(index);
      setCurrent(index);
      updateProgress(index);
      closePanels();
    });
    box.appendChild(item);
  }
}

// -------------------------------------------------------------- panneaux ---

function openPanel(panel) {
  closePanels();
  panel.hidden = false;
  $('scrim').hidden = false;
}

function closePanels() {
  $('settingsPanel').hidden = true;
  $('searchPanel').hidden = true;
  $('scrim').hidden = true;
}

// -------------------------------------------------------------- réglages ---

async function loadSettings() {
  const saved = await db.getSetting('settings');
  if (saved) Object.assign(state.settings, saved);
  uiLang = state.settings.uiLang || (I18N[navigator.language?.slice(0, 2)] ? navigator.language.slice(0, 2) : 'fr');
  $('uiLang').value = uiLang;

  engine.rate = state.settings.rate;
  engine.pitch = state.settings.pitch;
  engine.volume = state.settings.volume;
  $('rate').value = state.settings.rate;
  $('pitch').value = state.settings.pitch;
  $('volume').value = state.settings.volume;
  $('highlightWords').checked = state.settings.highlightWords;
  $('autoScroll').checked = state.settings.autoScroll;
  updateSettingLabels();
  applyI18n();
}

function saveSettings() {
  db.setSetting('settings', { ...state.settings, uiLang });
}

function updateSettingLabels() {
  $('rateOut').textContent = `${Number(state.settings.rate).toFixed(1)}×`;
  $('rateLabel').textContent = `${Number(state.settings.rate).toFixed(1)}×`;
  $('pitchOut').textContent = Number(state.settings.pitch).toFixed(1);
  $('volumeOut').textContent = `${Math.round(state.settings.volume * 100)} %`;
}

// ------------------------------------------------------------- câblage -----

function setPlayIcon(playing) {
  const btn = $('playBtn');
  btn.textContent = playing ? '⏸' : '▶️';
  btn.classList.toggle('playing', playing);
}

engine.onSentence = index => {
  setCurrent(index);
  updateProgress(index);
  if (state.book) {
    state.book.sentenceIndex = index;
    saver.save(state.book.id, { sentenceIndex: index, sentenceCount: state.sentences.length, openedAt: Date.now() });
  }
};
engine.onWord = highlightWord;
engine.onStateChange = s => {
  setPlayIcon(s === 'playing');
  document.body.classList.toggle('is-reading', s === 'playing');
  if (s !== 'playing') clearWordHighlight(state.currentEl);
};
engine.onEnd = () => { toast(t('endOfBook')); saver.flush(); };

function bind() {
  const fileInput = $('fileInput');
  fileInput.accept = SUPPORTED;
  const pick = () => fileInput.click();
  $('importBtn').addEventListener('click', pick);
  $('importBtn2').addEventListener('click', pick);
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) importFiles([...fileInput.files]);
    fileInput.value = '';
  });

  const zone = $('dropzone');
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
    e.preventDefault(); zone.classList.add('over');
  }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
    e.preventDefault(); zone.classList.remove('over');
  }));
  zone.addEventListener('drop', e => {
    if (e.dataTransfer?.files?.length) importFiles([...e.dataTransfer.files]);
  });

  $('homeBtn').addEventListener('click', () => { if (state.book) closeBook(); });
  $('backBtn').addEventListener('click', closeBook);

  // Transport
  $('playBtn').addEventListener('click', () => engine.toggle());
  $('stopBtn').addEventListener('click', () => {
    engine.stop();
    setCurrent(engine.index);
  });
  $('back1').addEventListener('click', () => engine.skip(-1));
  $('fwd1').addEventListener('click', () => engine.skip(1));
  $('back10').addEventListener('click', () => engine.skip(-10));
  $('fwd10').addEventListener('click', () => engine.skip(10));

  const seek = $('seekBar');
  seek.addEventListener('input', () => {
    const index = Number(seek.value);
    showPageFor(index);
    setCurrent(index);
    updateProgress(index);
  });
  seek.addEventListener('change', () => engine.seek(Number(seek.value)));

  // Clic sur une phrase : on lit à partir de là.
  $('textPane').addEventListener('click', e => {
    const span = e.target.closest('.sent');
    if (!span) return;
    const index = Number(span.dataset.i);
    engine.seek(index);
    setCurrent(index, false);
    updateProgress(index);
  });

  $('prevPage').addEventListener('click', () => {
    state.spans = [];
    showPageFor((state.page - 1) * PAGE_SIZE);
    $('textPane').scrollTop = 0;
  });
  $('nextPage').addEventListener('click', () => {
    state.spans = [];
    showPageFor((state.page + 1) * PAGE_SIZE);
    $('textPane').scrollTop = 0;
  });

  // Panneaux
  $('settingsBtn').addEventListener('click', () => openPanel($('settingsPanel')));
  $('searchBtn').addEventListener('click', () => {
    openPanel($('searchPanel'));
    $('searchInput').focus();
  });
  $('scrim').addEventListener('click', closePanels);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closePanels));

  // Langues et voix
  const langSelect = $('langSelect');
  for (const code of LANGS) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${LANG_NAMES.of(code)} (${code})`;
    langSelect.appendChild(opt);
  }
  langSelect.addEventListener('change', () => {
    renderVoiceOptions();
    if (state.book) {
      state.book.lang = langSelect.value;
      db.putBook({ ...state.book });
    }
    engine.applyLive();
  });
  $('voiceSelect').addEventListener('change', e => {
    const voice = voices.find(v => v.voiceURI === e.target.value) || null;
    engine.voice = voice;
    state.settings.voiceByLang[langSelect.value] = e.target.value;
    saveSettings();
    engine.applyLive();
  });

  // Curseurs
  const slider = (id, key, live = true) => $(id).addEventListener('input', e => {
    state.settings[key] = Number(e.target.value);
    engine[key] = state.settings[key];
    updateSettingLabels();
    saveSettings();
    if (live) clearTimeout(slider._t), slider._t = setTimeout(() => engine.applyLive(), 400);
  });
  slider('rate', 'rate');
  slider('pitch', 'pitch');
  slider('volume', 'volume');

  $('highlightWords').addEventListener('change', e => {
    state.settings.highlightWords = e.target.checked;
    if (!e.target.checked) clearWordHighlight(state.currentEl);
    saveSettings();
  });
  $('autoScroll').addEventListener('change', e => {
    state.settings.autoScroll = e.target.checked;
    saveSettings();
  });

  $('uiLang').addEventListener('change', e => {
    uiLang = e.target.value;
    applyI18n();
    saveSettings();
    if (!state.book) renderLibrary();
  });

  // Recherche
  let searchTimer = null;
  $('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    const value = e.target.value;
    searchTimer = setTimeout(() => runSearch(value), 200);
  });

  // Raccourcis clavier
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanels(); return; }
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!state.book) return;

    if (e.code === 'Space') { e.preventDefault(); engine.toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); engine.skip(e.shiftKey ? 10 : 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); engine.skip(e.shiftKey ? -10 : -1); }
    else if (e.key === '/') { e.preventDefault(); openPanel($('searchPanel')); $('searchInput').focus(); }
  });

  window.addEventListener('beforeunload', () => { saver.flush(); engine.synth.cancel(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) saver.flush(); });
}

// ---------------------------------------------------------------- départ ---

async function main() {
  await loadSettings();
  bind();
  await renderLibrary();

  if (!SpeechEngine.supported) {
    toast(t('unsupported'));
    document.querySelector('.player')?.classList.add('disabled');
    return;
  }
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

main();

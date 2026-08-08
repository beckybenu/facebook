// Découpage du texte en phrases + moteur de lecture (Web Speech API).

// --- Segmentation ----------------------------------------------------------

// Longueur maximale d'un énoncé envoyé au moteur vocal. Les navigateurs
// coupent le son sur les énoncés trop longs : on lit donc par fragments, tout
// en gardant la phrase comme unité de position.
function maxChunkChars(rate) {
  return Math.max(90, Math.round(220 * Math.min(1, rate)));
}

function splitLongSentence(text, start, limit) {
  const out = [];
  let cursor = 0;
  while (text.length - cursor > limit) {
    const window = text.slice(cursor, cursor + limit);
    // On coupe de préférence sur une ponctuation, sinon sur une espace.
    let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '),
                       window.lastIndexOf(' : '), window.lastIndexOf(' — '));
    if (cut < limit * 0.4) cut = window.lastIndexOf(' ');
    if (cut <= 0) cut = limit;
    out.push({ start: start + cursor, end: start + cursor + cut + 1 });
    cursor += cut + 1;
  }
  out.push({ start: start + cursor, end: start + text.length });
  return out;
}

// Renvoie [{start, end, para}] : décalages absolus dans `text`.
export function segment(text, lang = 'fr') {
  const sentences = [];
  const paragraphs = text.split(/\n{2,}|\n(?=\s*[-–—•*]|\s*(?:Chapitre|Chapter|CHAPITRE)\b)/g);
  let offset = 0;
  let paraIndex = 0;

  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(lang, { granularity: 'sentence' })
    : null;

  for (const para of paragraphs) {
    const paraStart = text.indexOf(para, offset);
    const start = paraStart === -1 ? offset : paraStart;
    offset = start + para.length;

    if (para.trim()) {
      const raw = [];
      if (segmenter) {
        for (const s of segmenter.segment(para)) {
          if (s.segment.trim()) raw.push({ start: start + s.index, text: s.segment });
        }
      } else {
        const re = /[^.!?…]+(?:[.!?…]+["'»”\)]*|\s*$)/g;
        let m;
        while ((m = re.exec(para))) {
          if (m[0].trim()) raw.push({ start: start + m.index, text: m[0] });
        }
      }
      for (const s of raw) {
        const trimmedStart = s.start + (s.text.length - s.text.trimStart().length);
        const body = s.text.trim();
        sentences.push({ start: trimmedStart, end: trimmedStart + body.length, para: paraIndex });
      }
      paraIndex++;
    }
  }

  if (!sentences.length && text.trim()) {
    sentences.push({ start: 0, end: text.length, para: 0 });
  }
  return sentences;
}

export function findSentenceAt(sentences, charOffset) {
  let lo = 0;
  let hi = sentences.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sentences[mid].start <= charOffset) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return best;
}

// --- Moteur de lecture -----------------------------------------------------

export class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.text = '';
    this.sentences = [];
    this.index = 0;
    this.chunks = [];
    this.chunkIndex = 0;
    this.state = 'idle';           // idle | playing | paused
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.lang = 'fr';
    this.token = 0;                // invalide les callbacks des énoncés annulés
    this.onSentence = null;        // (index) => void
    this.onWord = null;            // (absoluteCharOffset, length) => void
    this.onStateChange = null;     // (state) => void
    this.onEnd = null;             // () => void
  }

  static get supported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  load(text, sentences, index = 0) {
    this.stop();
    this.text = text;
    this.sentences = sentences;
    this.index = Math.min(Math.max(0, index), Math.max(0, sentences.length - 1));
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange?.(state);
  }

  play(index = this.index) {
    if (!this.sentences.length) return;
    this.index = Math.min(Math.max(0, index), this.sentences.length - 1);
    this.chunkIndex = 0;
    this.speakCurrent();
  }

  speakCurrent() {
    const sentence = this.sentences[this.index];
    if (!sentence) { this.finish(); return; }

    const body = this.text.slice(sentence.start, sentence.end);
    this.chunks = splitLongSentence(body, sentence.start, maxChunkChars(this.rate));
    this.chunkIndex = 0;
    this.setState('playing');
    this.onSentence?.(this.index);
    this.speakChunk();
  }

  speakChunk() {
    const chunk = this.chunks[this.chunkIndex];
    if (!chunk) { this.next(true); return; }

    const token = ++this.token;
    // `cancel()` avant chaque énoncé : évite l'empilement si l'utilisateur
    // enchaîne les sauts de phrase.
    this.synth.cancel();

    const utter = new SpeechSynthesisUtterance(this.text.slice(chunk.start, chunk.end));
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    utter.volume = this.volume;
    if (this.voice) utter.voice = this.voice;
    utter.lang = this.voice?.lang || this.lang;

    utter.onboundary = e => {
      if (token !== this.token || e.name === 'sentence') return;
      this.onWord?.(chunk.start + (e.charIndex || 0), e.charLength || 0);
    };
    utter.onend = () => {
      if (token !== this.token) return;
      this.chunkIndex++;
      if (this.chunkIndex < this.chunks.length) this.speakChunk();
      else this.next(true);
    };
    utter.onerror = e => {
      if (token !== this.token || e.error === 'interrupted' || e.error === 'canceled') return;
      this.setState('idle');
    };

    this.current = utter;
    // Chrome ignore parfois `speak()` appelé dans la foulée de `cancel()`.
    setTimeout(() => {
      if (token === this.token) this.synth.speak(utter);
    }, 0);
  }

  next(auto = false) {
    if (this.index + 1 >= this.sentences.length) {
      if (auto) { this.finish(); return; }
      return;
    }
    this.index++;
    if (this.state === 'idle') { this.onSentence?.(this.index); return; }
    this.speakCurrent();
  }

  finish() {
    this.synth.cancel();
    this.token++;
    this.setState('idle');
    this.onEnd?.();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.synth.pause();
    this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    // Certains navigateurs perdent l'énoncé en pause : on relit la phrase.
    if (!this.synth.paused) this.speakCurrent();
    else { this.synth.resume(); this.setState('playing'); }
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
    else this.play();
  }

  stop() {
    this.token++;
    this.synth.cancel();
    this.setState('idle');
  }

  // Déplacement relatif ou absolu ; reprend la lecture si elle était en cours.
  seek(index) {
    const wasReading = this.state !== 'idle';
    this.index = Math.min(Math.max(0, index), Math.max(0, this.sentences.length - 1));
    this.token++;
    this.synth.cancel();
    if (wasReading) {
      this.setState('playing');
      this.speakCurrent();
    } else {
      this.onSentence?.(this.index);
    }
  }

  skip(delta) {
    this.seek(this.index + delta);
  }

  // Un changement de voix/vitesse ne prend effet qu'au prochain énoncé :
  // on relance la phrase courante pour l'appliquer immédiatement.
  applyLive() {
    if (this.state === 'playing') this.speakCurrent();
    else if (this.state === 'paused') { this.stop(); this.onSentence?.(this.index); }
  }
}

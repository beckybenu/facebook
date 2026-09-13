// Sons synthétisés (Web Audio, aucun fichier) + retour haptique.
let ctx;
function ac() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const soundOn = () => localStorage.getItem('tipper_sound') !== '0';
const hapticOn = () => localStorage.getItem('tipper_haptic') !== '0';

function blip(freq, dur = 0.08, type = 'sine', vol = 0.05, when = 0) {
  if (!soundOn()) return;
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  const t = c.currentTime + when;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur);
}

export const sound = {
  tap() { blip(430, 0.05, 'sine', 0.035); },
  nav() { blip(560, 0.05, 'triangle', 0.04); },
  success() { blip(660, 0.09, 'sine', 0.05); blip(880, 0.11, 'sine', 0.045, 0.09); blip(1180, 0.16, 'sine', 0.04, 0.2); },
  coin() { blip(900, 0.06, 'square', 0.035); blip(1340, 0.1, 'square', 0.03, 0.06); },
  error() { blip(200, 0.16, 'sawtooth', 0.04); blip(150, 0.18, 'sawtooth', 0.035, 0.05); },
};

export function haptic(pattern = 10) {
  if (hapticOn() && navigator.vibrate) { try { navigator.vibrate(pattern); } catch { /* ignore */ } }
}

export function feedback(kind = 'tap') {
  (sound[kind] || sound.tap)();
  haptic(kind === 'success' ? [10, 30, 12] : kind === 'error' ? [20, 40, 20] : 9);
}

// Dérive de teinte à la lecture : la page part du violet et arrive au bleu.
// La progression suit le défilement, si bien que la couleur devient un repère
// de position autant qu'un effet. Les deux bornes viennent de la feuille de
// style (paires --*-debut / --*-fin), qui reste la seule source de vérité.

const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cssVar = (nom) => getComputedStyle(document.documentElement).getPropertyValue(nom).trim();

/* ————— conversions sRGB ↔ OKLab —————
   Le mélange se fait dans OKLab : entre un violet et un bleu, l'interpolation
   directe en sRGB s'assombrit et se désature au passage. */

function versLineaire(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function versOctet(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

function hexVersOklab(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = versLineaire((n >> 16) & 255);
  const v = versLineaire((n >> 8) & 255);
  const b = versLineaire(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * v + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * v + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * v + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabVersHex(L, a, b) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  const r = versOctet(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const v = versOctet(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = versOctet(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  return "#" + ((1 << 24) | (r << 16) | (v << 8) | bl).toString(16).slice(1);
}

function melange(a, b, k) {
  return oklabVersHex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
}

/* ————— pilotage ————— */

export function initTeinte(vitrine) {
  const racine = document.documentElement;

  // une variable réécrite, ses deux bornes lues dans la feuille de style
  const pistes = [
    ["--accent", "--accent-debut", "--accent-fin"],
    ["--accent-hi", "--accent-hi-debut", "--accent-hi-fin"],
    ["--accent-ink", "--accent-ink-debut", "--accent-ink-fin"],
    ["--brain-hot", "--accent-debut", "--accent-fin"],
    ["--brain-cold", "--brain-cold-debut", "--brain-cold-fin"],
  ].map(([cible, debut, fin]) => {
    const d = cssVar(debut);
    const f = cssVar(fin);
    return d && f ? { cible, d: hexVersOklab(d), f: hexVersOklab(f) } : null;
  }).filter(Boolean);

  if (!pistes.length) return;

  let cible = 0;      // là où le défilement nous place
  let courant = -1;   // là où la couleur est arrivée
  let image = 0;

  function progression() {
    const course = racine.scrollHeight - window.innerHeight;
    if (course <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / course));
  }

  function peindre(k) {
    const teintes = {};
    for (const p of pistes) {
      const c = melange(p.d, p.f, k);
      racine.style.setProperty(p.cible, c);
      teintes[p.cible] = c;
    }
    const cerveau = vitrine && vitrine.brain;
    if (cerveau) cerveau.setColors(teintes["--brain-cold"], teintes["--brain-hot"]);
  }

  // Le défilement par plans avance par sauts : on rattrape la cible au lieu de
  // la rejoindre d'un coup, pour que la couleur glisse au lieu de commuter.
  function rattraper() {
    image = 0;
    const ecart = cible - courant;
    courant += Math.abs(ecart) < 0.002 ? ecart : ecart * 0.14;
    peindre(courant);
    if (courant !== cible) image = requestAnimationFrame(rattraper);
  }

  function suivre() {
    cible = progression();
    if (reduit) {
      // Pas d'animation autonome : la couleur colle au défilement.
      if (Math.abs(cible - courant) > 0.001) { courant = cible; peindre(courant); }
      return;
    }
    if (!image) image = requestAnimationFrame(rattraper);
  }

  courant = progression();
  peindre(courant);

  window.addEventListener("scroll", suivre, { passive: true });
  window.addEventListener("resize", suivre, { passive: true });
}

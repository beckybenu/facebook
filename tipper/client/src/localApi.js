// ───────────────────────────────────────────────────────────────────────────
// Tipper v2 — moteur 100% navigateur (localStorage).
// Marketplace de coups de main rémunérés : escrow, réputation, cycle de mission
// à double validation, gamification (XP/niveaux), avis, favoris, classement.
// Aucune donnée ne quitte l'appareil. Utilisé pour la démo statique (Pages).
// ───────────────────────────────────────────────────────────────────────────

const DB_KEY = 'tipper_db_v2';
const TOKEN_KEY = 'tipper_token';
const MAX_PARTICIPANTS = 3;
export const CATEGORIES = ['administratif', 'automobile', 'epicerie', 'immobilier', 'petit_service', 'loisirs'];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null;
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ── Gamification ────────────────────────────────────────────────────────────
export const LEVELS = [
  { min: 0, name: 'Nouveau', emoji: '🌱' },
  { min: 100, name: 'Bronze', emoji: '🥉' },
  { min: 300, name: 'Argent', emoji: '🥈' },
  { min: 700, name: 'Or', emoji: '🥇' },
  { min: 1500, name: 'Platine', emoji: '💎' },
  { min: 3000, name: 'Légende', emoji: '👑' },
];
export function levelInfo(xp = 0) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? Math.min(1, (xp - cur.min) / (next.min - cur.min)) : 1;
  return { index: idx, ...cur, next, progress, xp };
}

function fakeToken(userId) {
  const payload = btoa(JSON.stringify({ id: userId })).replace(/=+$/, '');
  return `demo.${payload}.local`;
}

// ── Seed ────────────────────────────────────────────────────────────────────
function seed() {
  const users = [];
  const mk = (full_name, email, lat, lng, city, available, xp, verified) => {
    const u = {
      id: uid(), email, password: 'password', full_name, avatar: null, bio: null,
      available, reserved: 0, lat, lng, city, xp: xp || 0, verified: !!verified,
      saved: [], rating_sum: 0, rating_count: 0, created_at: minutesAgo(60 * 24 * 30),
    };
    users.push(u); return u;
  };
  const sophie = mk('Sophie Martin', 'sophie@tipper.app', 46.2044, 6.1432, 'Genève', 500, 820, true);
  const lucas = mk('Lucas Favre', 'lucas@tipper.app', 46.21, 6.15, 'Genève', 300, 360, true);
  const emma = mk('Emma Rochat', 'emma@tipper.app', 46.5197, 6.6323, 'Lausanne', 250, 140, false);
  const noah = mk('Noah Dubois', 'noah@tipper.app', 46.195, 6.138, 'Genève', 180, 1620, true);
  const lea = mk('Léa Girard', 'lea@tipper.app', 46.207, 6.146, 'Genève', 220, 540, true);

  const ads = [];
  const mka = (author, category, title, price, tip, description, dLat, dLng, opts = {}) =>
    ads.push({
      id: uid(), user_id: author.id, category, title, price, tip_amount: tip, photo: null,
      description, lat: author.lat + (dLat || 0), lng: author.lng + (dLng || 0), city: author.city,
      status: opts.status || 'open', urgent: !!opts.urgent, scheduled_at: opts.scheduled_at || null,
      delivered_app: null, created_at: opts.created_at || minutesAgo(opts.age || 120),
    });

  mka(sophie, 'automobile', 'Trouver un acheteur pour ma Mercedes S63 AMG', 64000, 2000,
    "J'offre CHF 2000.- à celui qui me trouve un acheteur sérieux pour ma Mercedes S63 AMG 2016 (valeur CHF 64'000.-).", 0, 0, { age: 30 });
  mka(sophie, 'epicerie', 'Un paquet de Marlboro rouge livré ce soir', 12, 8,
    "Je n'ai pas le temps de sortir : qui m'apporte un paquet de cigarettes avant 21h ?", 0.002, 0.001, { urgent: true, age: 12 });
  mka(lucas, 'petit_service', 'Monter une armoire IKEA PAX', null, 45,
    "Besoin d'un coup de main pour monter une armoire ce week-end. ~1h de travail.", 0, 0, { scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), age: 90 });
  mka(emma, 'administratif', "Aide pour ma déclaration d'impôts vaudoise", null, 80,
    "Je cherche quelqu'un de calé pour m'aider à remplir ma déclaration. Sur place ou en visio.", 0, 0, { age: 240 });
  mka(emma, 'immobilier', 'Trouver un studio à louer à Lausanne', null, 300,
    'CHF 300.- à qui me déniche un studio (max CHF 1200/mois) proche du centre avant fin du mois.', 0.001, 0, { age: 300 });
  mka(noah, 'loisirs', 'Partenaire de tennis dimanche matin', null, 20,
    "Cherche un joueur niveau intermédiaire pour 1h de tennis dimanche. Court réservé.", 0, 0, { scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(), age: 60 });
  mka(lea, 'petit_service', 'Promener mon chien 3 jours', null, 60,
    "Je pars en déplacement : qui peut sortir mon labrador matin et soir du 28 au 30 ?", 0, 0, { age: 45 });
  mka(lea, 'epicerie', 'Courses Migros pour personne âgée', 50, 15,
    "Faire les courses hebdo de ma grand-mère et les livrer. Liste fournie.", 0.001, 0.002, { urgent: true, age: 20 });

  // Avis & XP de départ pour des profils crédibles
  const reviews = [];
  const rev = (rater, ratee, stars, comment, role) =>
    reviews.push({ id: uid(), ad_id: null, rater_id: rater.id, ratee_id: ratee.id, role, stars, comment, created_at: minutesAgo(60 * 24 * Math.floor(Math.random() * 20 + 1)) });
  rev(sophie, noah, 5, 'Hyper efficace et sympa, je recommande !', 'helper');
  rev(lucas, noah, 5, 'Mission parfaite, ponctuel.', 'helper');
  rev(emma, noah, 4, 'Bon travail, communication au top.', 'helper');
  rev(noah, sophie, 5, 'Demandeuse claire et paiement immédiat.', 'poster');
  rev(sophie, lea, 5, 'Adorable avec mon chien 🐶', 'helper');
  rev(noah, lea, 4, 'Très fiable.', 'helper');
  rev(sophie, lucas, 5, 'Super bricoleur !', 'helper');
  for (const r of reviews) {
    const u = users.find((x) => x.id === r.ratee_id);
    u.rating_sum += r.stars; u.rating_count += 1;
  }

  const transactions = users.map((u) => ({ id: uid(), user_id: u.id, type: 'credit', amount: 50, description: 'Bonus de bienvenue 🎉', ad_id: null, created_at: u.created_at }));

  return { users, ads, applications: [], messages: [], notifications: [], transactions, reviews };
}

function load() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch { /* ignore */ }
  if (!db) { db = seed(); save(db); }
  return db;
}
function save(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function currentUserId() {
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])).id; } catch { return null; }
}
function requireUser(db) {
  const u = db.users.find((x) => x.id === currentUserId());
  if (!u) throw new Error('Authentification requise');
  return u;
}

function ratingOf(u) {
  return u.rating_count ? Math.round((u.rating_sum / u.rating_count) * 10) / 10 : null;
}
function badgesOf(db, u) {
  const b = [];
  if (u.verified) b.push({ key: 'verified', label: 'Vérifié', emoji: '✅' });
  const completedAsHelper = db.applications.filter((a) => a.user_id === u.id && a.status === 'completed').length;
  const posted = db.ads.filter((a) => a.user_id === u.id).length;
  const r = ratingOf(u);
  if (completedAsHelper >= 3) b.push({ key: 'helper', label: 'Super Helper', emoji: '🦸' });
  if (posted >= 3) b.push({ key: 'tipper', label: 'Top Tipper', emoji: '💸' });
  if (r != null && r >= 4.8 && u.rating_count >= 3) b.push({ key: 'fivestar', label: '5 étoiles', emoji: '⭐' });
  if (levelInfo(u.xp).index >= 4) b.push({ key: 'legend', label: 'Élite', emoji: '👑' });
  return b;
}
function publicUser(db, u) {
  if (!u) return null;
  return {
    id: u.id, email: u.email, full_name: u.full_name, avatar: u.avatar, bio: u.bio,
    available: u.available, reserved: u.reserved, wallet_balance: u.available,
    lat: u.lat, lng: u.lng, city: u.city, created_at: u.created_at, verified: u.verified,
    xp: u.xp, level: levelInfo(u.xp), rating: ratingOf(u), rating_count: u.rating_count,
    badges: db ? badgesOf(db, u) : [], saved: u.saved || [],
  };
}

function pushNotif(db, userId, { type, title, body, data = {} }) {
  db.notifications.push({ id: uid(), user_id: userId, type, title, body: body || '', data, read: 0, created_at: now() });
}
function addXp(db, userId, amount) {
  const u = db.users.find((x) => x.id === userId);
  if (u) u.xp = (u.xp || 0) + amount;
}

function adMeta(db, ad, viewer) {
  const author = db.users.find((u) => u.id === ad.user_id);
  const apps = db.applications.filter((a) => a.ad_id === ad.id);
  const accepted = apps.filter((a) => a.status === 'accepted' || a.status === 'delivered' || a.status === 'completed');
  return {
    ...ad,
    author: publicUser(db, author),
    applicants_count: apps.length,
    accepted_count: accepted.length,
    spots_left: Math.max(0, MAX_PARTICIPANTS - accepted.length),
    max_participants: MAX_PARTICIPANTS,
    distance_km: viewer ? distanceKm(viewer.lat, viewer.lng, ad.lat, ad.lng) : null,
    my_application: viewer ? apps.find((a) => a.user_id === viewer.id) || null : null,
    is_mine: viewer ? ad.user_id === viewer.id : false,
    is_saved: viewer ? (viewer.saved || []).includes(ad.id) : false,
  };
}

function fileToDataURL(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

export const localApi = {
  // ── auth ──
  async signup({ email, password, full_name }) {
    const db = load();
    if (!email || !password || !full_name) throw new Error('Tous les champs sont requis');
    if (password.length < 6) throw new Error('Mot de passe : 6 caractères minimum');
    if (db.users.find((u) => u.email === email.toLowerCase())) throw new Error('Un compte existe déjà avec cet email');
    const u = { id: uid(), email: email.toLowerCase(), password, full_name, avatar: null, bio: null, available: 50, reserved: 0, lat: null, lng: null, city: null, xp: 0, verified: false, saved: [], rating_sum: 0, rating_count: 0, created_at: now() };
    db.users.push(u);
    db.transactions.push({ id: uid(), user_id: u.id, type: 'credit', amount: 50, description: 'Bonus de bienvenue 🎉', ad_id: null, created_at: now() });
    save(db);
    return { token: fakeToken(u.id), user: publicUser(db, u) };
  },
  async login({ email, password }) {
    const db = load();
    const u = db.users.find((x) => x.email === String(email).toLowerCase());
    if (!u || u.password !== password) throw new Error('Email ou mot de passe incorrect');
    return { token: fakeToken(u.id), user: publicUser(db, u) };
  },
  async me() { const db = load(); return { user: publicUser(db, requireUser(db)) }; },

  // ── users ──
  async updateProfile(b) {
    const db = load(); const u = requireUser(db);
    Object.assign(u, { full_name: b.full_name ?? u.full_name, bio: b.bio ?? u.bio, avatar: b.avatar ?? u.avatar, city: b.city ?? u.city });
    if (b.lat != null) u.lat = parseFloat(b.lat);
    if (b.lng != null) u.lng = parseFloat(b.lng);
    save(db); return { user: publicUser(db, u) };
  },
  async setLocation({ lat, lng, city }) {
    const db = load(); const u = requireUser(db);
    u.lat = parseFloat(lat); u.lng = parseFloat(lng); if (city) u.city = city;
    save(db); return { user: publicUser(db, u) };
  },
  async getUser(id) {
    const db = load(); const u = db.users.find((x) => x.id === id);
    if (!u) throw new Error('Utilisateur introuvable');
    const reviews = db.reviews.filter((r) => r.ratee_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({ ...r, rater: publicUser(db, db.users.find((x) => x.id === r.rater_id)) }));
    return {
      user: publicUser(db, u),
      stats: {
        ads: db.ads.filter((a) => a.user_id === id).length,
        completed: db.applications.filter((a) => a.user_id === id && a.status === 'completed').length,
        earned: db.transactions.filter((t) => t.user_id === id && t.type === 'tip_in').reduce((s, t) => s + t.amount, 0),
      },
      reviews,
    };
  },

  // ── ads ──
  async listAds(params = {}) {
    const db = load(); const viewer = requireUser(db);
    let ads = db.ads.slice();
    if (params.mine === '1') ads = ads.filter((a) => a.user_id === viewer.id);
    else if (params.saved === '1') ads = ads.filter((a) => (viewer.saved || []).includes(a.id));
    else ads = ads.filter((a) => a.status !== 'cancelled');
    if (params.category && CATEGORIES.includes(params.category)) ads = ads.filter((a) => a.category === params.category);
    if (params.urgent === '1') ads = ads.filter((a) => a.urgent);
    if (params.q) { const q = params.q.toLowerCase(); ads = ads.filter((a) => (a.title + ' ' + (a.description || '')).toLowerCase().includes(q)); }
    let metas = ads.map((a) => adMeta(db, a, viewer));
    if (params.radius && viewer.lat != null) metas = metas.filter((a) => a.distance_km == null || a.distance_km <= Number(params.radius));
    const sort = params.sort || (viewer.lat != null ? 'distance' : 'recent');
    metas.sort((a, b) => {
      if (sort === 'tip') return b.tip_amount - a.tip_amount;
      if (sort === 'rating') return (b.author.rating || 0) - (a.author.rating || 0);
      if (sort === 'distance') return (a.distance_km == null ? 1e9 : a.distance_km) - (b.distance_km == null ? 1e9 : b.distance_km);
      return b.created_at.localeCompare(a.created_at);
    });
    return { ads: metas, categories: CATEGORIES };
  },
  async getAd(id) {
    const db = load(); const viewer = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad) throw new Error('Mission introuvable');
    const meta = adMeta(db, ad, viewer);
    meta.applications = db.applications.filter((a) => a.ad_id === id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((a) => ({ ...a, applicant: publicUser(db, db.users.find((u) => u.id === a.user_id)) }));
    meta.reviews = db.reviews.filter((r) => r.ad_id === id).map((r) => ({ ...r, rater: publicUser(db, db.users.find((u) => u.id === r.rater_id)) }));
    return { ad: meta };
  },
  async createAd(form) {
    const db = load(); const u = requireUser(db);
    const get = (k) => (form.get ? form.get(k) : form[k]);
    const category = get('category');
    if (!CATEGORIES.includes(category)) throw new Error('Catégorie invalide');
    const title = get('title');
    if (!title) throw new Error('Le titre est requis');
    const tip = parseFloat(get('tip_amount')) || 0;
    if (tip <= 0) throw new Error("Le pourboire doit être supérieur à 0");
    if (tip > u.available) throw new Error('Solde disponible insuffisant. Rechargez votre wallet.');
    // ESCROW : on bloque le pourboire
    u.available -= tip; u.reserved += tip;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'escrow_hold', amount: -tip, description: `Pourboire bloqué · ${title}`, ad_id: null, created_at: now() });
    const photoFile = form.get ? form.get('photo') : null;
    const photo = await fileToDataURL(photoFile && photoFile.size ? photoFile : null);
    const priceRaw = get('price');
    const ad = {
      id: uid(), user_id: u.id, category, title,
      price: priceRaw ? parseFloat(priceRaw) : null, tip_amount: tip, photo,
      description: get('description') || '', urgent: get('urgent') === '1' || get('urgent') === 'true',
      scheduled_at: get('scheduled_at') || null,
      lat: get('lat') ? parseFloat(get('lat')) : u.lat, lng: get('lng') ? parseFloat(get('lng')) : u.lng,
      city: get('city') || u.city, status: 'open', delivered_app: null, created_at: now(),
    };
    db.ads.push(ad);
    addXp(db, u.id, 10);
    save(db);
    return { ad: adMeta(db, ad, u) };
  },
  async toggleSave(adId) {
    const db = load(); const u = requireUser(db);
    u.saved = u.saved || [];
    const i = u.saved.indexOf(adId);
    if (i >= 0) u.saved.splice(i, 1); else u.saved.push(adId);
    save(db); return { saved: u.saved.includes(adId) };
  },
  // Helper signale la mission comme livrée
  async markDelivered(id, application_id) {
    const db = load(); const u = requireUser(db);
    const app = db.applications.find((a) => a.id === application_id && a.ad_id === id);
    if (!app || app.user_id !== u.id) throw new Error('Action non autorisée');
    if (app.status !== 'accepted') throw new Error('La mission doit être acceptée');
    app.status = 'delivered';
    const ad = db.ads.find((a) => a.id === id);
    ad.delivered_app = application_id;
    pushNotif(db, ad.user_id, { type: 'mission_delivered', title: '📦 Mission livrée', body: `${u.full_name} a marqué « ${ad.title} » comme terminée. Confirmez pour libérer le pourboire.`, data: { adId: id } });
    save(db); return { ok: true };
  },
  // Demandeur confirme -> libère l'escrow et paie le helper
  async confirmCompletion(id, application_id) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad || ad.user_id !== u.id) throw new Error("Action réservée au demandeur");
    const app = db.applications.find((a) => a.id === application_id && a.ad_id === id);
    if (!app || (app.status !== 'delivered' && app.status !== 'accepted')) throw new Error('Candidature non valide');
    if (u.reserved < ad.tip_amount) throw new Error('Escrow introuvable');
    const worker = db.users.find((x) => x.id === app.user_id);
    u.reserved -= ad.tip_amount;
    worker.available += ad.tip_amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'tip_out', amount: -ad.tip_amount, description: `Pourboire versé · ${ad.title}`, ad_id: id, created_at: now() });
    db.transactions.push({ id: uid(), user_id: worker.id, type: 'tip_in', amount: ad.tip_amount, description: `Pourboire reçu · ${ad.title}`, ad_id: id, created_at: now() });
    app.status = 'completed'; ad.status = 'completed';
    addXp(db, worker.id, 50); addXp(db, u.id, 15);
    pushNotif(db, worker.id, { type: 'tip_received', title: '💰 Pourboire reçu !', body: `CHF ${ad.tip_amount.toFixed(2)} crédités pour « ${ad.title} ». +50 XP !`, data: { adId: id, review: true, rateeId: u.id } });
    save(db); return { ok: true };
  },
  async cancelAd(id) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad || ad.user_id !== u.id) throw new Error("Action réservée au demandeur");
    if (ad.status === 'completed') throw new Error('Mission déjà terminée');
    // Rembourse l'escrow
    if (u.reserved >= ad.tip_amount) {
      u.reserved -= ad.tip_amount; u.available += ad.tip_amount;
      db.transactions.push({ id: uid(), user_id: u.id, type: 'escrow_refund', amount: ad.tip_amount, description: `Pourboire remboursé · ${ad.title}`, ad_id: id, created_at: now() });
    }
    ad.status = 'cancelled'; save(db); return { ok: true };
  },

  // ── reviews ──
  async rate({ ad_id, ratee_id, stars, comment, role }) {
    const db = load(); const u = requireUser(db);
    stars = Math.max(1, Math.min(5, parseInt(stars, 10) || 5));
    if (db.reviews.find((r) => r.ad_id === ad_id && r.rater_id === u.id && r.ratee_id === ratee_id)) {
      throw new Error('Vous avez déjà laissé un avis');
    }
    db.reviews.push({ id: uid(), ad_id: ad_id || null, rater_id: u.id, ratee_id, role: role || 'helper', stars, comment: comment || '', created_at: now() });
    const ratee = db.users.find((x) => x.id === ratee_id);
    ratee.rating_sum += stars; ratee.rating_count += 1;
    if (stars === 5) addXp(db, ratee_id, 20);
    pushNotif(db, ratee_id, { type: 'new_review', title: `⭐ Nouvel avis (${stars}/5)`, body: `${u.full_name} vous a évalué`, data: { fromUserId: u.id } });
    save(db); return { ok: true };
  },

  // ── leaderboard ──
  async leaderboard({ scope = 'global' } = {}) {
    const db = load(); const me = requireUser(db);
    let users = db.users.slice();
    if (scope === 'city' && me.city) users = users.filter((u) => u.city === me.city);
    users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const ranked = users.map((u, i) => ({ rank: i + 1, ...publicUser(db, u), is_me: u.id === me.id }));
    return { leaderboard: ranked.slice(0, 50), me_rank: ranked.find((r) => r.is_me)?.rank };
  },

  // ── applications ──
  async apply(adId, message) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) throw new Error('Mission introuvable');
    if (ad.status === 'cancelled' || ad.status === 'completed') throw new Error("Cette mission n'accepte plus de candidatures");
    if (ad.user_id === u.id) throw new Error('Vous ne pouvez pas postuler à votre propre mission');
    const apps = db.applications.filter((a) => a.ad_id === adId);
    if (apps.find((a) => a.user_id === u.id)) throw new Error('Vous avez déjà postulé');
    if (apps.filter((a) => a.status === 'accepted' || a.status === 'delivered' || a.status === 'completed').length >= MAX_PARTICIPANTS) throw new Error(`Maximum ${MAX_PARTICIPANTS} participants`);
    const app = { id: uid(), ad_id: adId, user_id: u.id, message: message || '', status: 'pending', created_at: now() };
    db.applications.push(app);
    pushNotif(db, ad.user_id, { type: 'new_application', title: '🙋 Nouvelle candidature', body: `${u.full_name} (${ratingOf(u) || '—'}★) a postulé à « ${ad.title} »`, data: { adId } });
    save(db); return { application: app };
  },
  async decide(appId, action) {
    const db = load(); const u = requireUser(db);
    const app = db.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Candidature introuvable');
    const ad = db.ads.find((a) => a.id === app.ad_id);
    if (ad.user_id !== u.id) throw new Error("Action réservée au demandeur");
    if (action === 'accept') {
      const accepted = db.applications.filter((a) => a.ad_id === ad.id && ['accepted', 'delivered', 'completed'].includes(a.status)).length;
      if (accepted >= MAX_PARTICIPANTS) throw new Error(`Maximum ${MAX_PARTICIPANTS} participants déjà acceptés`);
      app.status = 'accepted';
      if (ad.status === 'open') ad.status = 'in_progress';
      pushNotif(db, app.user_id, { type: 'application_accepted', title: '✅ Vous êtes pris !', body: `Candidature acceptée pour « ${ad.title} ». À vous de jouer !`, data: { adId: ad.id } });
    } else {
      app.status = 'rejected';
      pushNotif(db, app.user_id, { type: 'application_rejected', title: '❌ Candidature refusée', body: `« ${ad.title} » n'a pas été retenue cette fois`, data: { adId: ad.id } });
    }
    save(db); return { ok: true };
  },
  async myApplications() {
    const db = load(); const u = requireUser(db);
    const applications = db.applications.filter((a) => a.user_id === u.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => { const ad = db.ads.find((x) => x.id === a.ad_id) || {}; return { ...a, ad_title: ad.title, tip_amount: ad.tip_amount, ad_status: ad.status, photo: ad.photo, ad_id: a.ad_id }; });
    return { applications };
  },

  // ── wallet ──
  async wallet() {
    const db = load(); const u = requireUser(db);
    const transactions = db.transactions.filter((t) => t.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { available: u.available, reserved: u.reserved, balance: u.available, total: u.available + u.reserved, transactions };
  },
  async topup(amount) {
    const db = load(); const u = requireUser(db);
    amount = parseFloat(amount);
    if (!amount || amount <= 0) throw new Error('Montant invalide');
    if (amount > 5000) throw new Error('Maximum CHF 5000');
    u.available += amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'credit', amount, description: 'Rechargement du wallet', ad_id: null, created_at: now() });
    save(db); return { balance: u.available, available: u.available, reserved: u.reserved, user: publicUser(db, u) };
  },
  async withdraw(amount) {
    const db = load(); const u = requireUser(db);
    amount = parseFloat(amount);
    if (!amount || amount <= 0) throw new Error('Montant invalide');
    if (amount > u.available) throw new Error('Solde disponible insuffisant');
    u.available -= amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'debit', amount: -amount, description: 'Retrait bancaire', ad_id: null, created_at: now() });
    save(db); return { balance: u.available, available: u.available, reserved: u.reserved, user: publicUser(db, u) };
  },

  // ── notifications ──
  async vapidKey() { return { key: '' }; },
  async subscribePush() { return { ok: true }; },
  async notifications() {
    const db = load(); const u = requireUser(db);
    const notifications = db.notifications.filter((n) => n.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { notifications, unread: notifications.filter((n) => !n.read).length };
  },
  async readNotifications(id) {
    const db = load(); const u = requireUser(db);
    db.notifications.forEach((n) => { if (n.user_id === u.id && (!id || n.id === id)) n.read = 1; });
    save(db); return { ok: true };
  },

  // ── messages ──
  async threads() {
    const db = load(); const u = requireUser(db);
    const mine = db.messages.filter((m) => m.sender_id === u.id || m.receiver_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const map = new Map();
    for (const m of mine) {
      const other = m.sender_id === u.id ? m.receiver_id : m.sender_id;
      if (!map.has(other)) map.set(other, { user: publicUser(db, db.users.find((x) => x.id === other)), last_message: m.body, last_at: m.created_at, unread: 0 });
      if (m.receiver_id === u.id && !m.read) map.get(other).unread += 1;
    }
    return { threads: [...map.values()] };
  },
  async thread(userId) {
    const db = load(); const u = requireUser(db);
    const messages = db.messages.filter((m) => (m.sender_id === u.id && m.receiver_id === userId) || (m.sender_id === userId && m.receiver_id === u.id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
    db.messages.forEach((m) => { if (m.receiver_id === u.id && m.sender_id === userId) m.read = 1; });
    save(db);
    return { messages, user: publicUser(db, db.users.find((x) => x.id === userId)) };
  },
  async sendMessage({ receiver_id, body, ad_id }) {
    const db = load(); const u = requireUser(db);
    if (!receiver_id || !body) throw new Error('Message vide');
    const msg = { id: uid(), ad_id: ad_id || null, sender_id: u.id, receiver_id, body, read: 0, created_at: now() };
    db.messages.push(msg);
    pushNotif(db, receiver_id, { type: 'new_message', title: `💬 ${u.full_name}`, body: body.length > 80 ? body.slice(0, 80) + '…' : body, data: { fromUserId: u.id } });
    save(db); return { message: msg };
  },
};

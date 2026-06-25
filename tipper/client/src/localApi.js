// API 100% navigateur (localStorage) — pour la démo statique GitHub Pages.
// Reproduit fidèlement le backend Express : auth, annonces, candidatures (max 3),
// wallet, notifications, messagerie. Aucune donnée ne quitte le navigateur.

const DB_KEY = 'tipper_db_v1';
const TOKEN_KEY = 'tipper_token';
const MAX_PARTICIPANTS = 3;
const CATEGORIES = ['administratif', 'automobile', 'epicerie', 'immobilier', 'petit_service', 'loisirs'];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();

function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null;
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function fakeToken(userId) {
  const payload = btoa(JSON.stringify({ id: userId })).replace(/=+$/, '');
  return `demo.${payload}.local`;
}

function seed() {
  const users = [];
  const mk = (full_name, email, lat, lng, city, wallet_balance) => {
    const u = { id: uid(), email, password: 'password', full_name, avatar: null, bio: null, wallet_balance, lat, lng, city, created_at: now() };
    users.push(u); return u.id;
  };
  const sophie = mk('Sophie Martin', 'sophie@tipper.app', 46.2044, 6.1432, 'Genève', 500);
  const lucas = mk('Lucas Favre', 'lucas@tipper.app', 46.21, 6.15, 'Genève', 300);
  const emma = mk('Emma Rochat', 'emma@tipper.app', 46.5197, 6.6323, 'Lausanne', 250);
  const noah = mk('Noah Dubois', 'noah@tipper.app', 46.195, 6.138, 'Genève', 180);

  const ads = [];
  const mka = (user_id, category, title, price, tip_amount, description, lat, lng, city) =>
    ads.push({ id: uid(), user_id, category, title, price, tip_amount, photo: null, description, lat, lng, city, status: 'open', created_at: now() });

  mka(sophie, 'automobile', 'Je vends ma Mercedes S63 AMG 2016', 64000, 2000,
    "J'offre CHF 2000.- à celui qui arrive à me trouver un acheteur pour ma Mercedes S63 AMG 2016, valeur CHF 64'000.-", 46.2044, 6.1432, 'Genève');
  mka(sophie, 'epicerie', 'Je cherche un paquet de Marlboro rouge', 12, 5,
    "Celui qui m'apporte un paquet de cigarettes à la maison gagne CHF 5.-", 46.205, 6.144, 'Genève');
  mka(lucas, 'petit_service', 'Monter un meuble IKEA', null, 40,
    "Besoin d'aide pour monter une armoire PAX ce week-end. J'offre CHF 40.-", 46.21, 6.15, 'Genève');
  mka(emma, 'administratif', "Aide pour déclaration d'impôts", null, 80,
    "Je cherche quelqu'un pour m'aider à remplir ma déclaration d'impôts vaudoise.", 46.5197, 6.6323, 'Lausanne');
  mka(emma, 'immobilier', 'Trouver un studio à louer à Lausanne', null, 300,
    'CHF 300.- à qui me trouve un studio à louer (max CHF 1200/mois) proche du centre.', 46.5197, 6.6323, 'Lausanne');
  mka(noah, 'loisirs', 'Cherche partenaire de tennis', null, 20,
    'Je cherche quelqu\'un pour jouer au tennis dimanche matin. Petit pourboire pour la motivation 🎾', 46.195, 6.138, 'Genève');

  return {
    users, ads, applications: [], messages: [], notifications: [],
    transactions: users.map((u) => ({ id: uid(), user_id: u.id, type: 'credit', amount: 50, description: 'Bonus de bienvenue 🎉', ad_id: null, created_at: now() })),
  };
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
  const id = currentUserId();
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new Error('Authentification requise');
  return u;
}
const publicUser = (u) => u && ({ id: u.id, email: u.email, full_name: u.full_name, avatar: u.avatar, bio: u.bio, wallet_balance: u.wallet_balance, lat: u.lat, lng: u.lng, city: u.city, created_at: u.created_at });

function pushNotif(db, userId, { type, title, body, data = {} }) {
  db.notifications.push({ id: uid(), user_id: userId, type, title, body: body || '', data, read: 0, created_at: now() });
}

function adMeta(db, ad, viewer) {
  const author = db.users.find((u) => u.id === ad.user_id);
  const apps = db.applications.filter((a) => a.ad_id === ad.id);
  const accepted = apps.filter((a) => a.status === 'accepted' || a.status === 'completed');
  return {
    ...ad,
    author: publicUser(author),
    applicants_count: apps.length,
    accepted_count: accepted.length,
    spots_left: Math.max(0, MAX_PARTICIPANTS - accepted.length),
    max_participants: MAX_PARTICIPANTS,
    distance_km: viewer ? distanceKm(viewer.lat, viewer.lng, ad.lat, ad.lng) : null,
    my_application: viewer ? apps.find((a) => a.user_id === viewer.id) || null : null,
    is_mine: viewer ? ad.user_id === viewer.id : false,
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
  // ---- auth ----
  async signup({ email, password, full_name }) {
    const db = load();
    if (!email || !password || !full_name) throw new Error('Email, mot de passe et nom complet sont requis');
    if (password.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères');
    if (db.users.find((u) => u.email === email.toLowerCase())) throw new Error('Un compte existe déjà avec cet email');
    const u = { id: uid(), email: email.toLowerCase(), password, full_name, avatar: null, bio: null, wallet_balance: 50, lat: null, lng: null, city: null, created_at: now() };
    db.users.push(u);
    db.transactions.push({ id: uid(), user_id: u.id, type: 'credit', amount: 50, description: 'Bonus de bienvenue 🎉', ad_id: null, created_at: now() });
    save(db);
    return { token: fakeToken(u.id), user: publicUser(u) };
  },
  async login({ email, password }) {
    const db = load();
    const u = db.users.find((x) => x.email === String(email).toLowerCase());
    if (!u || u.password !== password) throw new Error('Email ou mot de passe incorrect');
    return { token: fakeToken(u.id), user: publicUser(u) };
  },
  async me() { const db = load(); return { user: publicUser(requireUser(db)) }; },

  // ---- users ----
  async updateProfile(b) {
    const db = load(); const u = requireUser(db);
    Object.assign(u, { full_name: b.full_name ?? u.full_name, bio: b.bio ?? u.bio, avatar: b.avatar ?? u.avatar, city: b.city ?? u.city });
    if (b.lat != null) u.lat = parseFloat(b.lat);
    if (b.lng != null) u.lng = parseFloat(b.lng);
    save(db); return { user: publicUser(u) };
  },
  async setLocation({ lat, lng, city }) {
    const db = load(); const u = requireUser(db);
    u.lat = parseFloat(lat); u.lng = parseFloat(lng); if (city) u.city = city;
    save(db); return { user: publicUser(u) };
  },
  async getUser(id) {
    const db = load(); const u = db.users.find((x) => x.id === id);
    if (!u) throw new Error('Utilisateur introuvable');
    return { user: publicUser(u), stats: {
      ads: db.ads.filter((a) => a.user_id === id).length,
      tips_received: db.transactions.filter((t) => t.user_id === id && t.type === 'tip_in').length,
    } };
  },

  // ---- ads ----
  async listAds(params = {}) {
    const db = load(); const viewer = requireUser(db);
    let ads = db.ads.slice();
    if (params.mine === '1') ads = ads.filter((a) => a.user_id === viewer.id);
    else ads = ads.filter((a) => a.status !== 'cancelled');
    if (params.category && CATEGORIES.includes(params.category)) ads = ads.filter((a) => a.category === params.category);
    if (params.q) { const q = params.q.toLowerCase(); ads = ads.filter((a) => (a.title + ' ' + (a.description || '')).toLowerCase().includes(q)); }
    ads = ads.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((a) => adMeta(db, a, viewer));
    if (params.mine !== '1' && viewer.lat != null) {
      ads.sort((a, b) => (a.distance_km == null ? 1 : b.distance_km == null ? -1 : a.distance_km - b.distance_km));
    }
    return { ads, categories: CATEGORIES };
  },
  async getAd(id) {
    const db = load(); const viewer = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad) throw new Error('Annonce introuvable');
    const meta = adMeta(db, ad, viewer);
    if (meta.is_mine) {
      meta.applications = db.applications.filter((a) => a.ad_id === id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((a) => ({ ...a, applicant: publicUser(db.users.find((u) => u.id === a.user_id)) }));
    }
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
    if (tip <= 0) throw new Error("Le pourboire (j'offre) doit être supérieur à 0");
    if (tip > u.wallet_balance) throw new Error('Solde insuffisant pour garantir ce pourboire. Rechargez votre wallet.');
    const photoFile = form.get ? form.get('photo') : null;
    const photo = await fileToDataURL(photoFile && photoFile.size ? photoFile : null);
    const priceRaw = get('price');
    const ad = {
      id: uid(), user_id: u.id, category, title,
      price: priceRaw ? parseFloat(priceRaw) : null,
      tip_amount: tip, photo, description: get('description') || '',
      lat: get('lat') ? parseFloat(get('lat')) : u.lat,
      lng: get('lng') ? parseFloat(get('lng')) : u.lng,
      city: get('city') || u.city, status: 'open', created_at: now(),
    };
    db.ads.push(ad); save(db);
    return { ad: adMeta(db, ad, u) };
  },
  async completeAd(id, application_id) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad || ad.user_id !== u.id) throw new Error("Action réservée à l'auteur");
    const app = db.applications.find((a) => a.id === application_id && a.ad_id === id);
    if (!app || app.status !== 'accepted') throw new Error('Candidature non valide ou non acceptée');
    if (u.wallet_balance < ad.tip_amount) throw new Error('Solde insuffisant pour verser le pourboire');
    const worker = db.users.find((x) => x.id === app.user_id);
    u.wallet_balance -= ad.tip_amount; worker.wallet_balance += ad.tip_amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'tip_out', amount: -ad.tip_amount, description: `Pourboire versé · ${ad.title}`, ad_id: id, created_at: now() });
    db.transactions.push({ id: uid(), user_id: worker.id, type: 'tip_in', amount: ad.tip_amount, description: `Pourboire reçu · ${ad.title}`, ad_id: id, created_at: now() });
    app.status = 'completed'; ad.status = 'completed';
    pushNotif(db, worker.id, { type: 'tip_received', title: '💰 Pourboire reçu !', body: `Vous avez reçu CHF ${ad.tip_amount.toFixed(2)} pour « ${ad.title} »`, data: { adId: id } });
    save(db); return { ok: true };
  },
  async cancelAd(id) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === id);
    if (!ad || ad.user_id !== u.id) throw new Error("Action réservée à l'auteur");
    ad.status = 'cancelled'; save(db); return { ok: true };
  },

  // ---- applications ----
  async apply(adId, message) {
    const db = load(); const u = requireUser(db);
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) throw new Error('Annonce introuvable');
    if (ad.status === 'cancelled' || ad.status === 'completed') throw new Error("Cette annonce n'accepte plus de candidatures");
    if (ad.user_id === u.id) throw new Error('Vous ne pouvez pas postuler à votre propre annonce');
    const apps = db.applications.filter((a) => a.ad_id === adId);
    if (apps.find((a) => a.user_id === u.id)) throw new Error('Vous avez déjà postulé à cette annonce');
    if (apps.length >= MAX_PARTICIPANTS) throw new Error(`Maximum ${MAX_PARTICIPANTS} participants atteint pour cette annonce`);
    const app = { id: uid(), ad_id: adId, user_id: u.id, message: message || '', status: 'pending', created_at: now() };
    db.applications.push(app);
    pushNotif(db, ad.user_id, { type: 'new_application', title: '🙋 Nouvelle candidature', body: `${u.full_name} a postulé à « ${ad.title} »`, data: { adId } });
    save(db); return { application: app };
  },
  async decide(appId, action) {
    const db = load(); const u = requireUser(db);
    const app = db.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Candidature introuvable');
    const ad = db.ads.find((a) => a.id === app.ad_id);
    if (ad.user_id !== u.id) throw new Error("Action réservée à l'auteur de l'annonce");
    if (action === 'accept') {
      const accepted = db.applications.filter((a) => a.ad_id === ad.id && (a.status === 'accepted' || a.status === 'completed')).length;
      if (accepted >= MAX_PARTICIPANTS) throw new Error(`Maximum ${MAX_PARTICIPANTS} participants déjà acceptés`);
      app.status = 'accepted';
      if (ad.status === 'open') ad.status = 'in_progress';
      pushNotif(db, app.user_id, { type: 'application_accepted', title: '✅ Candidature acceptée', body: `Votre candidature pour « ${ad.title} » a été acceptée !`, data: { adId: ad.id } });
    } else {
      app.status = 'rejected';
      pushNotif(db, app.user_id, { type: 'application_rejected', title: '❌ Candidature refusée', body: `Votre candidature pour « ${ad.title} » n'a pas été retenue`, data: { adId: ad.id } });
    }
    save(db); return { ok: true };
  },
  async myApplications() {
    const db = load(); const u = requireUser(db);
    const applications = db.applications.filter((a) => a.user_id === u.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => { const ad = db.ads.find((x) => x.id === a.ad_id) || {}; return { ...a, ad_title: ad.title, tip_amount: ad.tip_amount, ad_status: ad.status, photo: ad.photo }; });
    return { applications };
  },

  // ---- wallet ----
  async wallet() {
    const db = load(); const u = requireUser(db);
    const transactions = db.transactions.filter((t) => t.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { balance: u.wallet_balance, transactions };
  },
  async topup(amount) {
    const db = load(); const u = requireUser(db);
    amount = parseFloat(amount);
    if (!amount || amount <= 0) throw new Error('Montant invalide');
    if (amount > 5000) throw new Error('Montant maximum: CHF 5000');
    u.wallet_balance += amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'credit', amount, description: 'Rechargement du wallet', ad_id: null, created_at: now() });
    save(db); return { balance: u.wallet_balance, user: publicUser(u) };
  },
  async withdraw(amount) {
    const db = load(); const u = requireUser(db);
    amount = parseFloat(amount);
    if (!amount || amount <= 0) throw new Error('Montant invalide');
    if (amount > u.wallet_balance) throw new Error('Solde insuffisant');
    u.wallet_balance -= amount;
    db.transactions.push({ id: uid(), user_id: u.id, type: 'debit', amount: -amount, description: 'Retrait vers compte bancaire', ad_id: null, created_at: now() });
    save(db); return { balance: u.wallet_balance, user: publicUser(u) };
  },

  // ---- notifications ----
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

  // ---- messages ----
  async threads() {
    const db = load(); const u = requireUser(db);
    const mine = db.messages.filter((m) => m.sender_id === u.id || m.receiver_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const map = new Map();
    for (const m of mine) {
      const other = m.sender_id === u.id ? m.receiver_id : m.sender_id;
      if (!map.has(other)) map.set(other, { user: publicUser(db.users.find((x) => x.id === other)), last_message: m.body, last_at: m.created_at, unread: 0 });
      if (m.receiver_id === u.id && !m.read) map.get(other).unread += 1;
    }
    return { threads: [...map.values()] };
  },
  async thread(userId) {
    const db = load(); const u = requireUser(db);
    const messages = db.messages.filter((m) => (m.sender_id === u.id && m.receiver_id === userId) || (m.sender_id === userId && m.receiver_id === u.id)).sort((a, b) => a.created_at.localeCompare(b.created_at));
    db.messages.forEach((m) => { if (m.receiver_id === u.id && m.sender_id === userId) m.read = 1; });
    save(db);
    return { messages, user: publicUser(db.users.find((x) => x.id === userId)) };
  },
  async sendMessage({ receiver_id, body, ad_id }) {
    const db = load(); const u = requireUser(db);
    if (!receiver_id || !body) throw new Error('Destinataire et message requis');
    const msg = { id: uid(), ad_id: ad_id || null, sender_id: u.id, receiver_id, body, read: 0, created_at: now() };
    db.messages.push(msg);
    pushNotif(db, receiver_id, { type: 'new_message', title: `💬 ${u.full_name}`, body: body.length > 80 ? body.slice(0, 80) + '…' : body, data: { fromUserId: u.id } });
    save(db); return { message: msg };
  },
};

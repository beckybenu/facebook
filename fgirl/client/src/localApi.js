// Standalone in-browser backend used for the static GitHub Pages demo.
// Mirrors the Express + SQLite API but persists everything in localStorage,
// so the full marketplace works with no server. Exposes the same
// get/post/put/patch/del interface as the real api client.

const DB_KEY = 'fgirl_db';
const TOKEN_KEY = 'fgirl_token';

const SEED_COMPANIONS = [
  { name: 'Elena', city: 'Genève', age: 27, headline: 'Élégante & cultivée', rate: 350, img: 5,
    services: ['Dîner', 'Soirée', 'Compagnie', 'Événements'], languages: ['Français', 'Anglais', 'Italien'],
    bio: 'Compagne raffinée pour vos dîners et soirées en ville. J’apprécie les belles conversations et les restaurants gastronomiques.' },
  { name: 'Sofia', city: 'Lausanne', age: 24, headline: 'Pétillante et discrète', rate: 300, img: 9,
    services: ['Dîner', 'Voyage', 'Compagnie'], languages: ['Français', 'Espagnol'],
    bio: 'Étudiante en art, j’adore les voyages et les expositions. Discrétion et bonne humeur garanties.' },
  { name: 'Nadia', city: 'Zürich', age: 30, headline: 'Femme d’affaires bilingue', rate: 420, img: 16,
    services: ['Événements', 'Voyage', 'Dîner', 'Soirée'], languages: ['Allemand', 'Anglais', 'Français'],
    bio: 'Idéale pour vous accompagner à vos événements professionnels et galas. À l’aise dans tous les contextes.' },
  { name: 'Camille', city: 'Genève', age: 26, headline: 'Douce et attentionnée', rate: 320, img: 20,
    services: ['Compagnie', 'Massage', 'Dîner'], languages: ['Français', 'Anglais'],
    bio: 'Moment de détente et de complicité. J’aime prendre le temps et créer une vraie connexion.' },
  { name: 'Laura', city: 'Berne', age: 28, headline: 'Sportive & spontanée', rate: 280, img: 25,
    services: ['Voyage', 'Compagnie', 'Soirée'], languages: ['Allemand', 'Anglais'],
    bio: 'Passionnée de randonnée et de ski. Parfaite pour une escapade en montagne ou une soirée décontractée.' },
  { name: 'Yasmine', city: 'Lausanne', age: 25, headline: 'Charme oriental', rate: 340, img: 32,
    services: ['Dîner', 'Soirée', 'Compagnie', 'Massage'], languages: ['Français', 'Arabe', 'Anglais'],
    bio: 'Élégance et raffinement pour des moments inoubliables. Grande sensibilité artistique.' },
  { name: 'Chloé', city: 'Genève', age: 23, headline: 'Jeune et naturelle', rate: 290, img: 44,
    services: ['Compagnie', 'Dîner'], languages: ['Français', 'Anglais'],
    bio: 'Naturelle et souriante, j’aime les balades au bord du lac et les cafés cosy.' },
  { name: 'Isabella', city: 'Zürich', age: 29, headline: 'Sophistiquée & raffinée', rate: 450, img: 47,
    services: ['Événements', 'Voyage', 'Dîner', 'Soirée'], languages: ['Italien', 'Allemand', 'Anglais'],
    bio: 'Ancienne mannequin, parfaitement à l’aise dans les milieux exigeants. Voyages haut de gamme.' },
  { name: 'Marie', city: 'Fribourg', age: 31, headline: 'Mature et complice', rate: 300, img: 49,
    services: ['Compagnie', 'Dîner', 'Massage'], languages: ['Français', 'Allemand'],
    bio: 'Femme épanouie offrant écoute et complicité. Idéale pour des rencontres sincères et détendues.' },
  { name: 'Aurora', city: 'Lugano', age: 26, headline: 'Soleil du Tessin', rate: 360, img: 41,
    services: ['Voyage', 'Dîner', 'Soirée', 'Compagnie'], languages: ['Italien', 'Anglais', 'Français'],
    bio: 'Solaire et chaleureuse, j’aime la dolce vita et les soirées au bord du lac de Lugano.' },
  { name: 'Léa', city: 'Berne', age: 22, headline: 'Fraîche & enjouée', rate: 270, img: 24,
    services: ['Compagnie', 'Dîner'], languages: ['Français', 'Allemand', 'Anglais'],
    bio: 'Pleine d’énergie et de curiosité. J’adore découvrir de nouveaux endroits et rencontrer des gens.' },
  { name: 'Valentina', city: 'Genève', age: 28, headline: 'Glamour & VIP', rate: 500, img: 48,
    services: ['Événements', 'Voyage', 'Soirée', 'Dîner'], languages: ['Espagnol', 'Anglais', 'Français'],
    bio: 'Expérience VIP exclusive. Discrétion absolue pour clientèle exigeante et internationale.' },
];

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function load() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through to reseed */ }
  }
  return seed();
}

function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function seed() {
  const db = {
    users: [], profiles: [], favorites: [], bookings: [], messages: [], reviews: [],
    seq: { users: 0, profiles: 0, bookings: 0, messages: 0, reviews: 0 },
  };
  const nextId = (t) => (db.seq[t] += 1);

  const clientId = nextId('users');
  db.users.push({ id: clientId, email: 'client@demo.ch', password: 'password123', role: 'client', display_name: 'Thomas' });

  const avatar = (n) => `https://i.pravatar.cc/480?img=${n}`;
  const profileIds = [];
  SEED_COMPANIONS.forEach((c, i) => {
    const uid = nextId('users');
    db.users.push({ id: uid, email: `${c.name.toLowerCase()}@demo.ch`, password: 'password123', role: 'provider', display_name: c.name });
    const pid = nextId('profiles');
    db.profiles.push({
      id: pid, user_id: uid, display_name: c.name, city: c.city, age: c.age, gender: 'female',
      headline: c.headline, bio: c.bio, hourly_rate: c.rate, currency: 'CHF',
      services: c.services, languages: c.languages, photo_url: avatar(c.img),
      available: i % 4 === 0 ? 0 : 1, verified: i % 3 === 0 ? 1 : 0, created_at: now(),
    });
    profileIds.push(pid);
  });

  db.bookings.push({ id: nextId('bookings'), client_id: clientId, profile_id: profileIds[0], date: '2026-07-02 20:00', duration: 3, note: 'Dîner au centre-ville', status: 'completed', created_at: now() });
  db.bookings.push({ id: nextId('bookings'), client_id: clientId, profile_id: profileIds[2], date: '2026-07-10 19:00', duration: 2, note: 'Gala d’entreprise', status: 'pending', created_at: now() });
  db.reviews.push({ id: nextId('reviews'), profile_id: profileIds[0], client_id: clientId, rating: 5, comment: 'Soirée parfaite, conversation passionnante. Je recommande vivement.', created_at: now() });

  save(db);
  return db;
}

// ---- helpers ---------------------------------------------------------------

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function currentUser(db) {
  const id = Number(getToken());
  if (!id) return null;
  return db.users.find((u) => u.id === id) || null;
}

function publicUser(u) {
  return { id: u.id, email: u.email, role: u.role, displayName: u.display_name };
}

function ratingFor(db, profileId) {
  const list = db.reviews.filter((r) => r.profile_id === profileId);
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  return { avg: Number(avg.toFixed(2)), count: list.length };
}

function serializeProfile(db, p) {
  const r = ratingFor(db, p.id);
  return {
    id: p.id, userId: p.user_id, displayName: p.display_name, city: p.city, age: p.age,
    gender: p.gender, headline: p.headline, bio: p.bio, hourlyRate: p.hourly_rate,
    currency: p.currency, services: p.services, languages: p.languages, photoUrl: p.photo_url,
    available: !!p.available, verified: !!p.verified, createdAt: p.created_at,
    rating: r.avg, reviewCount: r.count,
  };
}

class ApiError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function requireUser(db, role) {
  const u = currentUser(db);
  if (!u) throw new ApiError('Authentication required', 401);
  if (role && u.role !== role) throw new ApiError(`Requires ${role} role`, 403);
  return u;
}

function parsePath(path) {
  const [p, query = ''] = path.split('?');
  return { segments: p.split('/').filter(Boolean), params: new URLSearchParams(query) };
}

// ---- request dispatcher ----------------------------------------------------

function handle(method, path, body) {
  const db = load();
  const { segments: s, params } = parsePath(path);
  const root = s[0];

  // ----- auth -----
  if (root === 'auth') {
    if (s[1] === 'register' && method === 'POST') {
      const { email, password, displayName, role } = body || {};
      if (!email || !password || !displayName || !role) throw new ApiError('email, password, displayName and role are required');
      if (!['client', 'provider'].includes(role)) throw new ApiError('role must be client or provider');
      if (String(password).length < 6) throw new ApiError('password must be at least 6 characters');
      if (db.users.some((u) => u.email === email.toLowerCase())) throw new ApiError('An account with this email already exists', 409);
      const id = (db.seq.users += 1);
      const user = { id, email: email.toLowerCase(), password: String(password), role, display_name: displayName };
      db.users.push(user); save(db);
      localStorage.setItem(TOKEN_KEY, String(id));
      return { token: String(id), user: publicUser(user) };
    }
    if (s[1] === 'login' && method === 'POST') {
      const { email, password } = body || {};
      const user = db.users.find((u) => u.email === String(email || '').toLowerCase());
      if (!user || user.password !== String(password)) throw new ApiError('Invalid email or password', 401);
      localStorage.setItem(TOKEN_KEY, String(user.id));
      return { token: String(user.id), user: publicUser(user) };
    }
    if (s[1] === 'me' && method === 'GET') {
      const u = requireUser(db);
      const profile = db.profiles.find((p) => p.user_id === u.id);
      return { user: { ...publicUser(u), profileId: profile ? profile.id : null } };
    }
  }

  // ----- profiles -----
  if (root === 'profiles') {
    if (s.length === 1 && method === 'GET') {
      let rows = [...db.profiles];
      const city = params.get('city');
      const service = params.get('service');
      const q = params.get('q');
      const minPrice = params.get('minPrice');
      const maxPrice = params.get('maxPrice');
      const minAge = params.get('minAge');
      const maxAge = params.get('maxAge');
      const sort = params.get('sort');
      if (city) rows = rows.filter((p) => p.city.toLowerCase() === city.toLowerCase());
      if (service) rows = rows.filter((p) => p.services.includes(service));
      if (minPrice) rows = rows.filter((p) => p.hourly_rate >= Number(minPrice));
      if (maxPrice) rows = rows.filter((p) => p.hourly_rate <= Number(maxPrice));
      if (minAge) rows = rows.filter((p) => p.age >= Number(minAge));
      if (maxAge) rows = rows.filter((p) => p.age <= Number(maxAge));
      if (params.get('available') === 'true') rows = rows.filter((p) => p.available);
      if (q) {
        const like = q.toLowerCase();
        rows = rows.filter((p) =>
          p.display_name.toLowerCase().includes(like) ||
          p.headline.toLowerCase().includes(like) ||
          p.bio.toLowerCase().includes(like));
      }
      if (sort === 'price_asc') rows.sort((a, b) => a.hourly_rate - b.hourly_rate);
      else if (sort === 'price_desc') rows.sort((a, b) => b.hourly_rate - a.hourly_rate);
      else if (sort === 'age_asc') rows.sort((a, b) => a.age - b.age);
      else rows.sort((a, b) => (b.verified - a.verified) || (b.created_at < a.created_at ? -1 : 1));
      return rows.map((p) => serializeProfile(db, p));
    }
    if (s[1] === 'cities' && method === 'GET') {
      const counts = {};
      db.profiles.forEach((p) => { counts[p.city] = (counts[p.city] || 0) + 1; });
      return Object.entries(counts).map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);
    }
    if (s[1] === 'me' && s[2] === 'profile') {
      const u = requireUser(db, 'provider');
      if (method === 'GET') {
        const p = db.profiles.find((x) => x.user_id === u.id);
        return p ? serializeProfile(db, p) : null;
      }
      if (method === 'PUT') {
        const b = body || {};
        const age = Number(b.age);
        if (!b.city || !b.displayName) throw new ApiError('displayName and city are required');
        if (!Number.isFinite(age) || age < 18) throw new ApiError('age must be 18 or older');
        let p = db.profiles.find((x) => x.user_id === u.id);
        const fields = {
          display_name: String(b.displayName), city: String(b.city), age, gender: b.gender || 'female',
          headline: b.headline || '', bio: b.bio || '', hourly_rate: Number(b.hourlyRate) || 0,
          currency: b.currency || 'CHF', services: Array.isArray(b.services) ? b.services : [],
          languages: Array.isArray(b.languages) ? b.languages : [], photo_url: b.photoUrl || '',
          available: b.available ? 1 : 0,
        };
        if (p) Object.assign(p, fields);
        else {
          p = { id: (db.seq.profiles += 1), user_id: u.id, verified: 0, created_at: now(), ...fields };
          db.profiles.push(p);
        }
        save(db);
        return serializeProfile(db, p);
      }
    }
    // /profiles/:id  and  /profiles/:id/reviews
    const id = Number(s[1]);
    const profile = db.profiles.find((p) => p.id === id);
    if (s[2] === 'reviews' && method === 'GET') {
      return db.reviews.filter((r) => r.profile_id === id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((r) => ({
          id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
          author: db.users.find((u) => u.id === r.client_id)?.display_name || 'Client',
        }));
    }
    if (s.length === 2 && method === 'GET') {
      if (!profile) throw new ApiError('Profile not found', 404);
      return serializeProfile(db, profile);
    }
  }

  // ----- favorites -----
  if (root === 'favorites') {
    const u = requireUser(db, 'client');
    if (s.length === 1 && method === 'GET') {
      return db.favorites.filter((f) => f.client_id === u.id)
        .map((f) => db.profiles.find((p) => p.id === f.profile_id))
        .filter(Boolean)
        .map((p) => serializeProfile(db, p));
    }
    const pid = Number(s[1]);
    if (method === 'POST') {
      if (!db.profiles.some((p) => p.id === pid)) throw new ApiError('Profile not found', 404);
      if (!db.favorites.some((f) => f.client_id === u.id && f.profile_id === pid)) {
        db.favorites.push({ client_id: u.id, profile_id: pid, created_at: now() });
        save(db);
      }
      return { ok: true };
    }
    if (method === 'DELETE') {
      db.favorites = db.favorites.filter((f) => !(f.client_id === u.id && f.profile_id === pid));
      save(db);
      return { ok: true };
    }
  }

  // ----- bookings -----
  if (root === 'bookings') {
    const u = requireUser(db);
    if (s.length === 1 && method === 'POST') {
      if (u.role !== 'client') throw new ApiError('Only clients can request bookings', 403);
      const { profileId, date, duration, note } = body || {};
      if (!profileId || !date) throw new ApiError('profileId and date are required');
      if (!db.profiles.some((p) => p.id === Number(profileId))) throw new ApiError('Profile not found', 404);
      const booking = { id: (db.seq.bookings += 1), client_id: u.id, profile_id: Number(profileId), date, duration: Number(duration) || 1, note: note || '', status: 'pending', created_at: now() };
      db.bookings.push(booking); save(db);
      return booking;
    }
    if (s.length === 1 && method === 'GET') {
      if (u.role === 'client') {
        return db.bookings.filter((b) => b.client_id === u.id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .map((b) => {
            const p = db.profiles.find((x) => x.id === b.profile_id);
            return { ...b, profile_name: p?.display_name, profile_city: p?.city, profile_photo: p?.photo_url };
          });
      }
      const myProfile = db.profiles.find((p) => p.user_id === u.id);
      return db.bookings.filter((b) => myProfile && b.profile_id === myProfile.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((b) => ({ ...b, client_name: db.users.find((x) => x.id === b.client_id)?.display_name }));
    }
    if (s.length === 2 && method === 'PATCH') {
      const booking = db.bookings.find((b) => b.id === Number(s[1]));
      if (!booking) throw new ApiError('Booking not found', 404);
      const { status } = body || {};
      if (!['accepted', 'declined', 'completed', 'cancelled'].includes(status)) throw new ApiError('Invalid status');
      const profile = db.profiles.find((p) => p.id === booking.profile_id);
      const isProvider = profile && profile.user_id === u.id;
      const isClient = booking.client_id === u.id;
      if (status === 'cancelled' && !isClient) throw new ApiError('Only the client can cancel', 403);
      if (status !== 'cancelled' && !isProvider) throw new ApiError('Only the provider can update this', 403);
      booking.status = status; save(db);
      return booking;
    }
  }

  // ----- messages -----
  if (root === 'messages') {
    const u = requireUser(db);
    if (s[1] === 'unread' && s[2] === 'count' && method === 'GET') {
      return { count: db.messages.filter((m) => m.recipient_id === u.id && !m.read).length };
    }
    if (s.length === 1 && method === 'GET') {
      const mine = db.messages.filter((m) => m.sender_id === u.id || m.recipient_id === u.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const seen = new Map();
      for (const m of mine) {
        const other = m.sender_id === u.id ? m.recipient_id : m.sender_id;
        if (!seen.has(other)) {
          const ou = db.users.find((x) => x.id === other);
          seen.set(other, { userId: other, displayName: ou?.display_name || 'Inconnu', role: ou?.role, lastMessage: m.body, lastAt: m.created_at, unread: 0 });
        }
        if (m.recipient_id === u.id && !m.read) seen.get(other).unread += 1;
      }
      return [...seen.values()];
    }
    const other = Number(s[1]);
    if (method === 'GET') {
      const thread = db.messages.filter((m) =>
        (m.sender_id === u.id && m.recipient_id === other) ||
        (m.sender_id === other && m.recipient_id === u.id))
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      db.messages.forEach((m) => { if (m.recipient_id === u.id && m.sender_id === other) m.read = 1; });
      save(db);
      return thread.map((m) => ({ ...m, mine: m.sender_id === u.id }));
    }
    if (method === 'POST') {
      const text = String(body?.body || '').trim();
      if (!text) throw new ApiError('Message body is required');
      if (!db.users.some((x) => x.id === other)) throw new ApiError('Recipient not found', 404);
      const msg = { id: (db.seq.messages += 1), sender_id: u.id, recipient_id: other, body: text, read: 0, created_at: now() };
      db.messages.push(msg); save(db);
      return { ...msg, mine: true };
    }
  }

  // ----- reviews -----
  if (root === 'reviews' && method === 'POST') {
    const u = requireUser(db, 'client');
    const pid = Number(s[1]);
    const value = Number(body?.rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new ApiError('rating must be an integer from 1 to 5');
    if (!db.profiles.some((p) => p.id === pid)) throw new ApiError('Profile not found', 404);
    if (!db.bookings.some((b) => b.client_id === u.id && b.profile_id === pid)) throw new ApiError('You can only review companions you have booked', 403);
    let review = db.reviews.find((r) => r.profile_id === pid && r.client_id === u.id);
    if (review) { review.rating = value; review.comment = body?.comment || ''; }
    else db.reviews.push({ id: (db.seq.reviews += 1), profile_id: pid, client_id: u.id, rating: value, comment: body?.comment || '', created_at: now() });
    save(db);
    return { ok: true };
  }

  throw new ApiError(`Not found: ${method} /${s.join('/')}`, 404);
}

function dispatch(method, path, body) {
  return new Promise((resolve, reject) => {
    try {
      resolve(handle(method, path, body));
    } catch (err) {
      reject(err instanceof Error ? err : new ApiError(String(err)));
    }
  });
}

export const localApi = {
  get: (p) => dispatch('GET', p),
  post: (p, body) => dispatch('POST', p, body ?? {}),
  put: (p, body) => dispatch('PUT', p, body ?? {}),
  patch: (p, body) => dispatch('PATCH', p, body ?? {}),
  del: (p) => dispatch('DELETE', p),
};

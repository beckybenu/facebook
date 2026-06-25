import bcrypt from 'bcryptjs';
import db from './db.js';

// Reset tables so the seed is idempotent.
db.exec(`
  DELETE FROM reviews;
  DELETE FROM messages;
  DELETE FROM bookings;
  DELETE FROM favorites;
  DELETE FROM profiles;
  DELETE FROM users;
  DELETE FROM sqlite_sequence WHERE name IN ('users','profiles','bookings','messages','reviews');
`);

const hash = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(
  'INSERT INTO users (email, password_hash, role, display_name) VALUES (?,?,?,?)'
);
const insertProfile = db.prepare(`
  INSERT INTO profiles (user_id, display_name, city, age, gender, headline, bio, hourly_rate,
    currency, services, languages, photo_url, available, verified)
  VALUES (@user_id,@display_name,@city,@age,@gender,@headline,@bio,@hourly_rate,@currency,
    @services,@languages,@photo_url,@available,@verified)
`);

// Avatar headshots via pravatar (non-explicit portrait placeholders).
const avatar = (n) => `https://i.pravatar.cc/480?img=${n}`;

const companions = [
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

const tx = db.transaction(() => {
  // A demo client account.
  const clientInfo = insertUser.run('client@demo.ch', hash, 'client', 'Thomas');
  const clientId = clientInfo.lastInsertRowid;

  const profileIds = [];
  companions.forEach((c, i) => {
    const email = `${c.name.toLowerCase()}@demo.ch`;
    const userInfo = insertUser.run(email, hash, 'provider', c.name);
    const info = insertProfile.run({
      user_id: userInfo.lastInsertRowid,
      display_name: c.name,
      city: c.city,
      age: c.age,
      gender: 'female',
      headline: c.headline,
      bio: c.bio,
      hourly_rate: c.rate,
      currency: 'CHF',
      services: JSON.stringify(c.services),
      languages: JSON.stringify(c.languages),
      photo_url: avatar(c.img),
      available: i % 4 === 0 ? 0 : 1,
      verified: i % 3 === 0 ? 1 : 0,
    });
    profileIds.push(info.lastInsertRowid);
  });

  // A couple of bookings + reviews from the demo client for realism.
  db.prepare('INSERT INTO bookings (client_id, profile_id, date, duration, note, status) VALUES (?,?,?,?,?,?)')
    .run(clientId, profileIds[0], '2026-07-02 20:00', 3, 'Dîner au centre-ville', 'completed');
  db.prepare('INSERT INTO bookings (client_id, profile_id, date, duration, note, status) VALUES (?,?,?,?,?,?)')
    .run(clientId, profileIds[2], '2026-07-10 19:00', 2, 'Gala d’entreprise', 'pending');

  db.prepare('INSERT INTO reviews (profile_id, client_id, rating, comment) VALUES (?,?,?,?)')
    .run(profileIds[0], clientId, 5, 'Soirée parfaite, conversation passionnante. Je recommande vivement.');
});

tx();

console.log('Seeded fgirl with', companions.length, 'companions + 1 demo client.');
console.log('Demo logins (password: password123):');
console.log('  client@demo.ch   (client)');
console.log('  elena@demo.ch    (provider)');

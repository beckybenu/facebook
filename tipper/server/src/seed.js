import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from './db.js';

console.log('🌱 Réinitialisation des données de démo…');

db.exec(`
  DELETE FROM messages; DELETE FROM notifications; DELETE FROM transactions;
  DELETE FROM applications; DELETE FROM ads; DELETE FROM push_subscriptions; DELETE FROM users;
`);

const pass = bcrypt.hashSync('password', 10);
function user(name, email, lat, lng, city, balance = 200) {
  const id = nanoid();
  db.prepare('INSERT INTO users (id, email, password_hash, full_name, wallet_balance, lat, lng, city) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, email, pass, name, balance, lat, lng, city);
  return id;
}

const sophie = user('Sophie Martin', 'sophie@tipper.app', 46.2044, 6.1432, 'Genève', 500);
const lucas = user('Lucas Favre', 'lucas@tipper.app', 46.2100, 6.1500, 'Genève', 300);
const emma = user('Emma Rochat', 'emma@tipper.app', 46.5197, 6.6323, 'Lausanne', 250);
const noah = user('Noah Dubois', 'noah@tipper.app', 46.1950, 6.1380, 'Genève', 180);

function ad(uid, category, title, price, tip, desc, lat, lng, city, photo = null) {
  const id = nanoid();
  db.prepare(`INSERT INTO ads (id, user_id, category, title, price, tip_amount, photo, description, lat, lng, city)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, uid, category, title, price, tip, photo, desc, lat, lng, city);
  return id;
}

ad(sophie, 'automobile', 'Je vends ma Mercedes S63 AMG 2016', 64000, 2000,
  "J'offre CHF 2000.- à celui qui arrive à me trouver un acheteur pour ma Mercedes S63 AMG 2016, valeur CHF 64'000.-",
  46.2044, 6.1432, 'Genève');

ad(sophie, 'epicerie', 'Je cherche un paquet de Marlboro rouge', 12, 5,
  "Celui qui m'apporte un paquet de cigarettes à la maison gagne CHF 5.-",
  46.2050, 6.1440, 'Genève');

ad(lucas, 'petit_service', 'Monter un meuble IKEA', null, 40,
  "Besoin d'aide pour monter une armoire PAX ce week-end. J'offre CHF 40.-",
  46.2100, 6.1500, 'Genève');

ad(emma, 'administratif', 'Aide pour déclaration d\'impôts', null, 80,
  "Je cherche quelqu'un pour m'aider à remplir ma déclaration d'impôts vaudoise.",
  46.5197, 6.6323, 'Lausanne');

ad(emma, 'immobilier', 'Trouver un studio à louer à Lausanne', null, 300,
  "CHF 300.- à qui me trouve un studio à louer (max CHF 1200/mois) proche du centre.",
  46.5197, 6.6323, 'Lausanne');

ad(noah, 'loisirs', 'Cherche partenaire de tennis', null, 20,
  "Je cherche quelqu'un pour jouer au tennis dimanche matin. Petit pourboire pour la motivation 🎾",
  46.1950, 6.1380, 'Genève');

console.log('✅ Données créées.');
console.log('   Comptes de test (mot de passe: "password") :');
console.log('   - sophie@tipper.app');
console.log('   - lucas@tipper.app');
console.log('   - emma@tipper.app');
console.log('   - noah@tipper.app');
process.exit(0);

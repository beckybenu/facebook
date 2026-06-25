import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from './db.js';

console.log('🌱 Réinitialisation des données de démo…');

db.exec(`
  DELETE FROM messages; DELETE FROM notifications; DELETE FROM transactions;
  DELETE FROM applications; DELETE FROM reviews; DELETE FROM saved_ads;
  DELETE FROM disputes; DELETE FROM commissions; DELETE FROM commission_payouts; DELETE FROM ads;
  DELETE FROM push_subscriptions; DELETE FROM users;
`);

const pass = bcrypt.hashSync('password', 10);
function user(name, email, lat, lng, city, balance, xp, verified) {
  const id = nanoid();
  db.prepare(`INSERT INTO users (id, email, password_hash, full_name, wallet_balance, xp, verified, lat, lng, city, referral_code)
              VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, email, pass, name, balance, xp || 0, verified ? 1 : 0, lat, lng, city, 'TIP' + id.slice(0, 5).toUpperCase());
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?,?,?,?,?)')
    .run(nanoid(), id, 'credit', 50, 'Bonus de bienvenue 🎉');
  return id;
}

const sophie = user('Sophie Martin', 'sophie@tipper.app', 46.2044, 6.1432, 'Genève', 500, 820, 1);
const lucas = user('Lucas Favre', 'lucas@tipper.app', 46.21, 6.15, 'Genève', 300, 360, 1);
const emma = user('Emma Rochat', 'emma@tipper.app', 46.5197, 6.6323, 'Lausanne', 250, 140, 0);
const noah = user('Noah Dubois', 'noah@tipper.app', 46.195, 6.138, 'Genève', 180, 1620, 1);
const lea = user('Léa Girard', 'lea@tipper.app', 46.207, 6.146, 'Genève', 220, 540, 1);
user('Admin Tipper', 'admin@tipper.app', 46.2044, 6.1432, 'Genève', 1000, 0, 1);

function ad(uid, category, title, price, tip, desc, lat, lng, city, opts = {}) {
  const id = nanoid();
  db.prepare(`INSERT INTO ads (id, user_id, category, title, price, tip_amount, description, lat, lng, city, urgent, scheduled_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, uid, category, title, price, tip, desc, lat, lng, city, opts.urgent ? 1 : 0, opts.scheduled_at || null);
  return id;
}

ad(sophie, 'automobile', 'Trouver un acheteur pour ma Mercedes S63 AMG', 64000, 2000,
  "J'offre 2000 🪙 à celui qui me trouve un acheteur pour ma Mercedes S63 AMG 2016 (valeur CHF 64'000.-).", 46.2044, 6.1432, 'Genève');
ad(sophie, 'epicerie', 'Un paquet de Marlboro rouge livré ce soir', 12, 8,
  "Qui m'apporte un paquet de cigarettes avant 21h ?", 46.205, 6.144, 'Genève', { urgent: 1 });
ad(lucas, 'petit_service', 'Monter une armoire IKEA PAX', null, 45,
  "Coup de main pour monter une armoire ce week-end. ~1h.", 46.21, 6.15, 'Genève', { scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString() });
ad(emma, 'administratif', "Aide déclaration d'impôts vaudoise", null, 80,
  "Quelqu'un de calé pour m'aider à remplir ma déclaration.", 46.5197, 6.6323, 'Lausanne');
ad(emma, 'immobilier', 'Trouver un studio à louer à Lausanne', null, 300,
  '300 🪙 à qui me déniche un studio (max CHF 1200/mois) proche du centre.', 46.5197, 6.6323, 'Lausanne');
ad(noah, 'loisirs', 'Partenaire de tennis dimanche matin', null, 20,
  "Cherche un joueur niveau intermédiaire pour 1h dimanche.", 46.195, 6.138, 'Genève', { scheduled_at: new Date(Date.now() + 3 * 86400000).toISOString() });
ad(lea, 'petit_service', 'Promener mon chien 3 jours', null, 60,
  "Je pars : qui sort mon labrador matin et soir du 28 au 30 ?", 46.207, 6.146, 'Genève');
ad(lea, 'epicerie', 'Courses Migros pour personne âgée', 50, 15,
  "Faire les courses hebdo de ma grand-mère et les livrer.", 46.206, 6.148, 'Genève', { urgent: 1 });

function review(rater, ratee, stars, comment, role) {
  db.prepare('INSERT INTO reviews (id, ad_id, rater_id, ratee_id, role, stars, comment) VALUES (?,?,?,?,?,?,?)')
    .run(nanoid(), null, rater, ratee, role, stars, comment);
  db.prepare('UPDATE users SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?').run(stars, ratee);
}
review(sophie, noah, 5, 'Hyper efficace et sympa !', 'helper');
review(lucas, noah, 5, 'Mission parfaite, ponctuel.', 'helper');
review(emma, noah, 4, 'Bon travail.', 'helper');
review(noah, sophie, 5, 'Paiement immédiat.', 'poster');
review(sophie, lea, 5, 'Adorable avec mon chien 🐶', 'helper');
review(sophie, lucas, 5, 'Super bricoleur !', 'helper');

console.log('✅ Données créées. Comptes (mot de passe: "password") :');
console.log('   sophie@ · lucas@ · emma@ · noah@ · lea@  (tipper.app)');
process.exit(0);

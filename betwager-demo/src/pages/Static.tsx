import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { PageHeader, formatMoney } from "../ui";

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-6 text-slate-300">{children}</div>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-xl font-bold text-white">{children}</h2>;
}

export function HowItWorks() {
  const steps = [
    {
      title: "1. Créez votre compte",
      body: "Inscription gratuite en moins d'une minute. Un bonus de bienvenue de 5 € est crédité immédiatement pour tester la plateforme.",
    },
    {
      title: "2. Déposez des fonds",
      body: "Alimentez votre portefeuille de 5 € à 1 000 € par dépôt. Les fonds sont disponibles instantanément pour miser.",
    },
    {
      title: "3. Créez ou acceptez un match",
      body: "Choisissez votre jeu, votre plateforme, vos règles et votre mise (1 € à 500 €). Votre mise est bloquée en garantie ; celle de l'adversaire aussi dès qu'il accepte.",
    },
    {
      title: "4. Jouez et déclarez le résultat",
      body: "Disputez le match sur votre console ou PC, puis déclarez chacun votre résultat sur Betwager. Si les déclarations concordent, le vainqueur est payé automatiquement.",
    },
    {
      title: "5. Encaissez vos gains",
      body: "Les gains sont crédités instantanément (2× la mise, moins les frais de service). Retirez vers votre compte bancaire à partir de 10 €.",
    },
  ];
  return (
    <div>
      <PageHeader title="Comment ça marche" subtitle="De l'inscription à l'encaissement, en cinq étapes." />
      <Prose>
        {steps.map((s) => (
          <div key={s.title} className="card p-6">
            <h2 className="font-bold text-white">{s.title}</h2>
            <p className="mt-2 text-sm">{s.body}</p>
          </div>
        ))}
        <div className="card border-danger/40 p-6">
          <h2 className="font-bold text-danger">⚖️ Et en cas de litige ?</h2>
          <p className="mt-2 text-sm">
            Si les deux joueurs revendiquent la victoire, le match passe en litige et les
            fonds restent bloqués. Un arbitre Betwager examine les preuves (captures,
            vidéos, historiques de jeu) et tranche : victoire attribuée ou match annulé
            avec remboursement. Les déclarations mensongères répétées entraînent le
            bannissement.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-white">💸 Les frais</h2>
          <p className="mt-2 text-sm">
            Betwager prélève 10 % de frais de service sur les gains de match (5 % pour
            les membres Elite). Les dépôts et retraits sont gratuits. Sur les tournois,
            la cagnotte est intégralement redistribuée (70 % au vainqueur, 30 % au
            finaliste), et la maison ajoute souvent un bonus.
          </p>
        </div>
        <div className="text-center">
          <Link to="/register" className="btn-primary !px-8 !py-3">
            Commencer maintenant
          </Link>
        </div>
      </Prose>
    </div>
  );
}

export function FAQ() {
  const items = [
    ["Betwager est-il un site de paris ?", "Non. Betwager est une plateforme de compétition par le skill : vous ne pariez pas sur le résultat d'autres joueurs, vous misez sur votre propre performance dans des matchs que vous jouez vous-même."],
    ["Comment déposer de l'argent ?", "Depuis votre portefeuille, choisissez un montant (5 € à 1 000 €) et un moyen de paiement. Dans cette démo, le dépôt est simulé et crédité instantanément."],
    ["Comment retirer mes gains ?", "Depuis votre portefeuille, demandez un retrait (minimum 10 €). Le virement est traité sous 24 à 48 h ouvrées."],
    ["Quels sont les frais ?", "10 % de frais de service sur les gains de match, 5 % pour les membres Elite. Dépôts et retraits gratuits."],
    ["Que se passe-t-il si mon adversaire ment sur le résultat ?", "Le match passe en litige : un arbitre examine les preuves et tranche. Conservez toujours une capture ou une vidéo de fin de match."],
    ["Comment sont gérés les tricheurs ?", "Tolérance zéro : tout usage de triche (mods, lag switch, boosting) entraîne la confiscation des gains et le bannissement définitif."],
    ["Quels jeux sont disponibles ?", "Call of Duty, Fortnite, EA Sports FC, NBA 2K, Rocket League et Street Fighter 6 — la liste s'agrandit régulièrement."],
    ["Quel âge faut-il avoir ?", "18 ans minimum. Des vérifications d'identité peuvent être demandées lors des retraits."],
    ["Puis-je jouer entre plateformes différentes ?", "Oui, sur les jeux cross-platform (indiqués « Cross-plateforme »). Sinon, chaque match précise sa plateforme."],
    ["Comment devenir membre Elite ?", "Le statut Elite est attribué aux joueurs les plus actifs. Il réduit vos frais de service à 5 % et débloque des tournois exclusifs."],
    ["Les tournois gratuits rapportent-ils de l'argent réel ?", "Oui ! Betwager finance des cagnottes bonus sur les tournois gratuits — vous pouvez gagner sans miser."],
  ];
  return (
    <div>
      <PageHeader title="Foire aux questions" subtitle="Tout ce qu'il faut savoir avant votre premier match." />
      <div className="mx-auto max-w-3xl space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="card group p-5">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-white">
              {q}
              <span className="ml-4 text-accent transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-slate-300">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function About() {
  const { state } = useStore();
  const totalPayouts = state.transactions
    .filter((t) => t.type === "WAGER_PAYOUT" || t.type === "TOURNAMENT_PRIZE")
    .reduce((s, t) => s + t.amountCents, 0);
  return (
    <div>
      <PageHeader title="À propos de Betwager" />
      <Prose>
        <p>
          Betwager est née d'une conviction simple : le temps passé à devenir
          excellent sur un jeu mérite plus que des points d'expérience. Nous
          construisons la plateforme où chaque joueur peut transformer son skill
          en gains réels, dans un cadre équitable et sécurisé.
        </p>
        <H2>Nos valeurs</H2>
        <ul className="list-inside list-disc space-y-2 text-sm">
          <li><span className="font-semibold text-white">Fair-play d'abord</span> — arbitrage humain, preuves exigées, tricheurs bannis à vie.</li>
          <li><span className="font-semibold text-white">Paiements rapides</span> — gains crédités instantanément, retraits sous 48 h.</li>
          <li><span className="font-semibold text-white">Communauté</span> — des tournois gratuits chaque semaine pour que tout le monde puisse jouer.</li>
        </ul>
        <H2>Betwager en chiffres</H2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5 text-center">
            <p className="text-2xl font-black text-accent">{state.users.length}</p>
            <p className="text-xs uppercase tracking-wider text-muted">Joueurs</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-black text-accent">{state.matches.length}</p>
            <p className="text-xs uppercase tracking-wider text-muted">Matchs</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-black text-gold">{formatMoney(totalPayouts)}</p>
            <p className="text-xs uppercase tracking-wider text-muted">Gains distribués</p>
          </div>
        </div>
      </Prose>
    </div>
  );
}

export function Terms() {
  const articles = [
    ["1. Objet", "Les présentes conditions régissent l'utilisation de Betwager, plateforme de mise en relation de joueurs pour des compétitions de jeux vidéo avec enjeu financier fondées sur l'adresse."],
    ["2. Éligibilité", "L'inscription est réservée aux personnes majeures (18 ans révolus) disposant de la capacité juridique. Une vérification d'identité peut être exigée à tout moment."],
    ["3. Compte", "Chaque utilisateur ne peut détenir qu'un seul compte. Les informations fournies doivent être exactes. Le partage de compte est interdit."],
    ["4. Dépôts et retraits", "Les dépôts sont plafonnés à 1 000 € par opération. Les retraits (minimum 10 €) sont traités sous 48 h ouvrées vers un moyen de paiement au nom du titulaire du compte."],
    ["5. Frais de service", "Betwager prélève 10 % sur les gains de match (5 % pour les membres Elite). Le barème est affiché avant chaque mise."],
    ["6. Fair-play et anti-triche", "Toute forme de triche, collusion ou manipulation de résultat entraîne la confiscation des fonds engagés et la clôture du compte."],
    ["7. Litiges", "En cas de déclarations contradictoires, les fonds sont gelés jusqu'à la décision d'un arbitre. Les décisions d'arbitrage sont définitives."],
    ["8. Responsabilité", "Betwager n'est pas responsable des interruptions de service des plateformes de jeu tierces. Jouez de manière responsable."],
    ["9. Résiliation", "L'utilisateur peut clôturer son compte à tout moment ; le solde disponible lui est restitué après vérifications d'usage."],
    ["10. Droit applicable", "Les présentes conditions sont soumises au droit du pays d'établissement de l'exploitant. Tout litige relève des tribunaux compétents de ce ressort."],
  ];
  return (
    <div>
      <PageHeader title="Conditions d'utilisation" subtitle="Version en vigueur — lisez-les avant de jouer." />
      <Prose>
        {articles.map(([t, b]) => (
          <section key={t}>
            <h2 className="font-bold text-white">{t}</h2>
            <p className="mt-1 text-sm">{b}</p>
          </section>
        ))}
      </Prose>
    </div>
  );
}

export function Privacy() {
  const sections = [
    ["Données collectées", "Email, pseudo, gamertags, historique de matchs et de transactions, adresse IP de connexion. Dans cette démo, toutes les données restent dans votre navigateur (localStorage) et ne quittent jamais votre appareil."],
    ["Utilisation", "Fournir le service (matchs, paiements, classements), prévenir la fraude et la triche, répondre à vos demandes de support."],
    ["Cookies", "Un cookie de session est utilisé pour vous maintenir connecté. Aucun cookie publicitaire tiers."],
    ["Conservation", "Les données de compte sont conservées tant que le compte est actif, puis 5 ans à des fins de conformité."],
    ["Vos droits (RGPD)", "Accès, rectification, effacement, portabilité et opposition : écrivez à privacy@betwager.gg. Vous pouvez aussi saisir la CNIL."],
    ["Contact", "Délégué à la protection des données : privacy@betwager.gg."],
  ];
  return (
    <div>
      <PageHeader title="Politique de confidentialité" />
      <Prose>
        {sections.map(([t, b]) => (
          <section key={t}>
            <h2 className="font-bold text-white">{t}</h2>
            <p className="mt-1 text-sm">{b}</p>
          </section>
        ))}
      </Prose>
    </div>
  );
}

export function Support() {
  const { me, mutate, state } = useStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!me) return;
    if (subject.trim().length < 3 || body.trim().length < 10) {
      setError("Précisez un sujet et un message (10 caractères minimum).");
      return;
    }
    const res = mutate((s) => {
      s.users
        .filter((u) => u.role === "ADMIN")
        .forEach((admin) => {
          s.notifications.unshift({
            id: Math.random().toString(36).slice(2, 12),
            userId: admin.id,
            title: `Support : ${subject.trim()} — ${me.username}`,
            body: body.trim(),
            href: "",
            read: false,
            createdAt: new Date().toISOString(),
          });
        });
    });
    if (!res.ok) setError(res.error);
    else {
      setSent(true);
      setSubject("");
      setBody("");
    }
  }

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Une question, un litige, un souci de paiement ? Notre équipe répond 7 j/7."
      />
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
        <div className="card p-6">
          <span className="text-2xl">📧</span>
          <p className="mt-2 font-bold text-white">Email</p>
          <p className="text-sm text-accent">support@betwager.gg</p>
          <p className="mt-1 text-xs text-muted">Réponse sous 24 h</p>
        </div>
        <div className="card p-6">
          <span className="text-2xl">💬</span>
          <p className="mt-2 font-bold text-white">Discord</p>
          <p className="text-sm text-accent">discord.gg/betwager</p>
          <p className="mt-1 text-xs text-muted">Communauté et assistance en direct</p>
        </div>
        <div className="card p-6">
          <span className="text-2xl">⚖️</span>
          <p className="mt-2 font-bold text-white">Litiges</p>
          <p className="text-sm text-slate-300">Traités en priorité</p>
          <p className="mt-1 text-xs text-muted">Décision sous 12 h en moyenne</p>
        </div>

        <div className="card p-7 md:col-span-3">
          {!me ? (
            <div className="text-center">
              <p className="text-muted">Connectez-vous pour contacter le support.</p>
              <Link to="/login" className="btn-primary mt-4">Connexion</Link>
            </div>
          ) : sent ? (
            <div className="text-center">
              <p className="text-lg font-bold text-accent">✅ Message envoyé !</p>
              <p className="mt-2 text-sm text-muted">
                Notre équipe vous répondra sous 24 h. ({state.users.filter((u) => u.role === "ADMIN").length}{" "}
                arbitre(s) notifié(s))
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Sujet</label>
                <input
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex. : problème de retrait"
                  required
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input min-h-32"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Décrivez votre demande avec un maximum de détails…"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Envoyer au support</button>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

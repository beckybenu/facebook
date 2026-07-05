import Link from "next/link";

const columns = [
  {
    title: "Compétition",
    links: [
      { href: "/wagers", label: "Matchs à mise" },
      { href: "/tournaments", label: "Tournois" },
      { href: "/games", label: "Jeux" },
      { href: "/leaderboard", label: "Classement" },
    ],
  },
  {
    title: "Assistance",
    links: [
      { href: "/how-it-works", label: "Comment ça marche" },
      { href: "/faq", label: "FAQ" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Betwager",
    links: [
      { href: "/about", label: "À propos" },
      { href: "/terms", label: "Conditions d'utilisation" },
      { href: "/privacy", label: "Confidentialité" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-edge bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-black text-[#04150C]">
              B
            </span>
            <span className="font-black tracking-tight text-white">
              BET<span className="text-accent">WAGER</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted">
            La plateforme e-sport où votre skill rapporte. Matchs à mise,
            tournois cash et classements sur vos jeux préférés.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-edge px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Betwager. Tous droits réservés. Jeu de
        compétence réservé aux 18 ans et plus — jouez de manière responsable.
      </div>
    </footer>
  );
}

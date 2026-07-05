import { Link, Outlet, useNavigate } from "react-router-dom";
import { useStore } from "./store";
import { Avatar, formatMoney } from "./ui";

const navLinks = [
  { to: "/wagers", label: "Matchs à mise" },
  { to: "/tournaments", label: "Tournois" },
  { to: "/games", label: "Jeux" },
  { to: "/leaderboard", label: "Classement" },
];

const footerColumns = [
  {
    title: "Compétition",
    links: [
      { to: "/wagers", label: "Matchs à mise" },
      { to: "/tournaments", label: "Tournois" },
      { to: "/games", label: "Jeux" },
      { to: "/leaderboard", label: "Classement" },
    ],
  },
  {
    title: "Assistance",
    links: [
      { to: "/how-it-works", label: "Comment ça marche" },
      { to: "/faq", label: "FAQ" },
      { to: "/support", label: "Support" },
    ],
  },
  {
    title: "Betwager",
    links: [
      { to: "/about", label: "À propos" },
      { to: "/terms", label: "Conditions d'utilisation" },
      { to: "/privacy", label: "Confidentialité" },
    ],
  },
];

export default function Layout() {
  const { state, me, logout, resetDemo } = useStore();
  const navigate = useNavigate();
  const unread = me
    ? state.notifications.filter((n) => n.userId === me.id && !n.read).length
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-edge bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-black text-[#04150C] shadow-glow">
                B
              </span>
              <span className="text-lg font-black tracking-tight text-white">
                BET<span className="text-accent">WAGER</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-sm font-medium text-muted transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {me ? (
            <div className="flex items-center gap-3">
              <Link
                to="/wallet"
                className="hidden items-center gap-2 rounded-lg border border-edge bg-elevated px-3 py-1.5 text-sm font-bold text-accent transition-colors hover:border-accent/60 sm:flex"
              >
                💰 {formatMoney(me.balanceCents)}
              </Link>
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-elevated text-sm transition-colors hover:border-accent/60"
                aria-label="Notifications"
              >
                🔔
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
              {me.role === "ADMIN" ? (
                <Link
                  to="/admin"
                  className="hidden text-sm font-medium text-gold hover:underline sm:block"
                >
                  Admin
                </Link>
              ) : null}
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar username={me.username} color={me.avatarColor} size={34} />
                <span className="hidden text-sm font-semibold text-white md:block">
                  {me.username}
                </span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="hidden text-sm font-medium text-muted transition-colors hover:text-danger sm:block"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-muted transition-colors hover:text-white"
              >
                Connexion
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-edge px-4 py-2 lg:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="whitespace-nowrap text-sm font-medium text-muted hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

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
            <button
              onClick={() => {
                if (confirm("Réinitialiser toutes les données de la démo ?"))
                  resetDemo();
              }}
              className="mt-4 text-xs text-muted underline hover:text-danger"
            >
              Réinitialiser la démo
            </button>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-slate-300 transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-edge px-4 py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} Betwager — démo interactive (données
          stockées dans votre navigateur). Jeu de compétence réservé aux 18 ans
          et plus.
        </div>
      </footer>
    </div>
  );
}

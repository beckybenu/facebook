import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/LogoutButton";

const navLinks = [
  { href: "/wagers", label: "Matchs à mise" },
  { href: "/tournaments", label: "Tournois" },
  { href: "/games", label: "Jeux" },
  { href: "/leaderboard", label: "Classement" },
];

export async function Navbar() {
  const user = await getCurrentUser();
  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, read: false },
      })
    : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-black text-[#04150C] shadow-glow">
              B
            </span>
            <span className="text-lg font-black tracking-tight text-white">
              BET<span className="text-accent">WAGER</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/wallet"
              className="hidden items-center gap-2 rounded-lg border border-edge bg-elevated px-3 py-1.5 text-sm font-bold text-accent transition-colors hover:border-accent/60 sm:flex"
            >
              💰 {formatMoney(user.balanceCents)}
            </Link>
            <Link
              href="/notifications"
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
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="hidden text-sm font-medium text-gold hover:underline sm:block"
              >
                Admin
              </Link>
            ) : null}
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar username={user.username} color={user.avatarColor} size={34} />
              <span className="hidden text-sm font-semibold text-white md:block">
                {user.username}
              </span>
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted transition-colors hover:text-white"
            >
              Connexion
            </Link>
            <Link href="/register" className="btn-primary !px-4 !py-2">
              S&apos;inscrire
            </Link>
          </div>
        )}
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-edge px-4 py-2 lg:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-sm font-medium text-muted hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

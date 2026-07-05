import Link from "next/link";
import type { ReactNode } from "react";

/** Pastille de statut colorée pour matchs / tournois / transactions. */
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-accent-soft text-accent",
    ACCEPTED: "bg-violet-soft text-violet",
    REPORTED: "bg-gold/15 text-gold",
    COMPLETED: "bg-accent-soft text-accent",
    DISPUTED: "bg-danger/15 text-danger",
    CANCELLED: "bg-muted/15 text-muted",
    REGISTRATION: "bg-accent-soft text-accent",
    LIVE: "bg-danger/15 text-danger",
    RESOLVED: "bg-accent-soft text-accent",
  };
  const labels: Record<string, string> = {
    OPEN: "Ouvert",
    ACCEPTED: "En cours",
    REPORTED: "Résultat déclaré",
    COMPLETED: "Terminé",
    DISPUTED: "Litige",
    CANCELLED: "Annulé",
    REGISTRATION: "Inscriptions ouvertes",
    LIVE: "En direct",
    RESOLVED: "Résolu",
  };
  return (
    <span className={`badge ${styles[status] ?? "bg-muted/15 text-muted"}`}>
      {labels[status] ?? status}
    </span>
  );
}

/** Avatar rond basé sur l'initiale du pseudo. */
export function Avatar({
  username,
  color,
  size = 40,
}: {
  username: string;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-[#04150C]"
      style={{
        width: size,
        height: size,
        backgroundColor: color ?? "#00E67F",
        fontSize: size * 0.42,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-4xl">🎮</span>
      <p className="text-lg font-semibold text-white">{title}</p>
      {subtitle ? <p className="max-w-md text-sm text-muted">{subtitle}</p> : null}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  const labels: Record<string, string> = {
    PS5: "PlayStation",
    XBOX: "Xbox",
    PC: "PC",
    CROSS: "Cross-plateforme",
  };
  return (
    <span className="badge border border-edge bg-elevated text-slate-300">
      {labels[platform] ?? platform}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
    >
      ← {label}
    </Link>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/money";
import { PageHeader, EmptyState } from "@/components/ui";
import MarkAllReadButton from "@/components/auth/MarkAllReadButton";

export const metadata = { title: "Notifications — Betwager" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            : "Vous êtes à jour."
        }
        action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          subtitle="Vos alertes de matchs, tournois et paiements apparaîtront ici."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const content = (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notif.read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    ) : null}
                    <p
                      className={`truncate font-semibold ${
                        notif.read ? "text-slate-300" : "text-white"
                      }`}
                    >
                      {notif.title}
                    </p>
                  </div>
                  {notif.body ? (
                    <p className="mt-1 text-sm text-muted">{notif.body}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-xs text-muted">
                  {formatDate(notif.createdAt)}
                </p>
              </div>
            );

            const className = `card block px-6 py-4 transition-colors ${
              notif.read
                ? "hover:border-edge"
                : "border-accent/50 bg-elevated"
            } ${notif.href ? "hover:border-accent/60" : ""}`;

            return notif.href ? (
              <Link key={notif.id} href={notif.href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={notif.id} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

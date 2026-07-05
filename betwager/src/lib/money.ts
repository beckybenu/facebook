/** Formate un montant en centimes vers un affichage en euros à la française. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Frais de service prélevés sur les gains : 10 % (5 % pour les membres Elite). */
export function serviceFeeCents(grossCents: number, elite: boolean): number {
  return Math.round(grossCents * (elite ? 0.05 : 0.1));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

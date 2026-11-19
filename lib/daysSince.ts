/**
 * Whole calendar days from an ISO date (YYYY-MM-DD) to today, counted in Irish
 * time, so the number ticks over at midnight in Dublin rather than at midnight
 * wherever the visitor happens to be.
 *
 * Used at build time for the number in the static HTML, and again in the
 * browser so the figure is right on the day someone actually reads it.
 */
export function daysSince(isoDate: string, now: Date = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [y, m, d] = today.split("-").map(Number);
  const [sy, sm, sd] = isoDate.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(sy, sm - 1, sd)) / 86_400_000);
}

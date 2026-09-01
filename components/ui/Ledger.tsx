import type { Metric } from "@/content/projects";
import CountUp from "@/components/motion/CountUp";

/**
 * The figure ledger. Part 6.4.
 *
 * Four identical stat cards is the default treatment and it reads as generated,
 * so these are set as a ledger instead: a hairline above, mono figures, labels
 * beneath in dim text, left-aligned in their columns.
 *
 * Exactly one figure per ledger carries colour, and it is the one that carries
 * the argument. On the restaurant project that is "times the house was
 * undercharged: 0". Never colour more than one.
 */
export default function Ledger({
  metrics,
  countUp = false,
  columns = 4,
  className = "",
}: {
  metrics: Metric[];
  countUp?: boolean;
  columns?: 3 | 4;
  className?: string;
}) {
  const cols = columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <dl
      className={`grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[var(--stroke)] pt-6 ${cols} ${className}`.trim()}
    >
      {metrics.map((m) => (
        <div key={m.label} className="border-l border-[var(--stroke)] pl-4">
          <dd
            className={`mono text-[23px] leading-none tracking-tight ${
              m.tone === "ok"
                ? "text-[var(--ok)]"
                : m.tone === "fail"
                  ? "text-[var(--fail)]"
                  : "text-[var(--text)]"
            }`}
          >
            {countUp ? <CountUp value={m.value} /> : m.value}
          </dd>
          <dt className="mono mt-2 text-[11px] uppercase leading-snug tracking-[0.1em] text-[var(--dim)]">{m.label}</dt>
        </div>
      ))}
    </dl>
  );
}

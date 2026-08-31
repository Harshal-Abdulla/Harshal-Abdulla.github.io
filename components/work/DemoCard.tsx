import { ArrowUpRight } from "lucide-react";
import Panel from "@/components/ui/Panel";

/**
 * Part 6.6. The prominent card for the interactive demo.
 *
 * It links out rather than embedding in an iframe.
 *
 * There is no screenshot here yet. Rather than leave a placeholder box, the
 * card shows the worked example itself: the same two dishes rung in two orders,
 * with the two legitimate totals that result. It carries no branding and no
 * business data, and it demonstrates the effect instead of picturing a UI that
 * demonstrates it. Replace with a real screenshot when there is one worth using.
 */
const RECEIPTS = [
  {
    order: "Egg fried tapped first",
    taps: ["Curry, rice declined", "Egg fried rice", "Boiled rice"],
    free: "Egg fried rice",
    total: "€4.30",
  },
  {
    order: "Boiled tapped first",
    taps: ["Curry, rice declined", "Boiled rice", "Egg fried rice"],
    free: "Boiled rice",
    total: "€3.95",
  },
];

export default function DemoCard() {
  return (
    <Panel className="overflow-hidden p-6 sm:p-8">
      <p className="mono text-meta text-[var(--dim)]">Interactive demo</p>
      <h3 className="mt-2 text-sub font-semibold text-[var(--text)]">
        Tap the same food in a different order, watch the bill change
      </h3>

      <p className="prose-measure mt-4 text-body text-[var(--dim)]">
        The demo runs the real pricing rule, ported verbatim, entirely in your
        browser. You can ring in a basket, reverse the tap order, and re-run the
        full 20,000-basket experiment yourself. It carries no branding and no
        business data.
      </p>

      {/* The worked example, rendered rather than screenshotted. Only the two
          totals are shown, because only the two totals were measured. */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {RECEIPTS.map((r) => (
          <div
            key={r.order}
            className="rounded-panel border border-[var(--stroke)] bg-[rgba(0,0,0,0.22)] p-5"
          >
            <p className="mono text-meta text-[var(--dim)]">{r.order}</p>
            <ol className="mono mt-4 space-y-2 text-[13px]">
              {r.taps.map((tap, i) => (
                <li key={tap} className="flex items-baseline gap-3">
                  <span className="text-[var(--dim)]">{i + 1}</span>
                  <span
                    className={
                      tap === r.free ? "text-[var(--ok)]" : "text-[var(--text)]"
                    }
                  >
                    {tap}
                    {tap === r.free ? (
                      <span className="text-[var(--ok)]"> (free side)</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--stroke)] pt-3">
              <span className="text-meta text-[var(--dim)]">Charged for sides</span>
              <span className="mono text-[22px] tabular-nums text-[var(--text)]">
                {r.total}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-meta text-[var(--dim)]">
        Identical food. 35 cents apart. Both are legitimate menu prices.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a
          href="https://order-dependent-pricing.surge.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-button bg-[var(--accent)] px-5 py-3 text-[15px] font-semibold leading-none text-[#0B0E14] transition-all duration-[180ms] hover:-translate-y-[2px] hover:bg-[var(--accent-hover)]"
        >
          Open the demo
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <a
          href="https://github.com/Harshal-Abdulla/order-dependent-pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-button text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
        >
          Demo source
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </Panel>
  );
}

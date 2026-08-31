import type { Metric } from "@/content/projects";

/**
 * Part 6.6. Five rows, and the zero at the bottom is the whole argument, so it
 * gets the weight and the only colour on the table.
 */
export default function PricingTable({ rows }: { rows: Metric[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">
          Results measured over 20,000 baskets, each rung in twice
        </caption>
        <thead>
          <tr className="border-b border-[var(--stroke)]">
            <th scope="col" className="pb-3 pr-4 text-meta font-normal text-[var(--dim)]">
              Measure
            </th>
            <th scope="col" className="pb-3 text-right text-meta font-normal text-[var(--dim)]">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isArgument = row.tone === "ok";
            return (
              <tr
                key={row.label}
                className={`border-b border-[var(--stroke)] last:border-b-0 ${
                  isArgument ? "border-t border-t-[var(--stroke-bright)]" : ""
                }`}
              >
                <th
                  scope="row"
                  className={`py-4 pr-4 text-body font-normal ${
                    isArgument ? "text-[var(--text)]" : "text-[var(--dim)]"
                  }`}
                >
                  {row.label}
                </th>
                <td
                  className={`mono py-4 text-right tabular-nums ${
                    isArgument
                      ? "text-[26px] font-medium leading-none text-[var(--ok)]"
                      : "text-[16px] text-[var(--text)]"
                  }`}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

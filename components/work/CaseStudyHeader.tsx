import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export interface CaseLink {
  label: string;
  href?: string;
  /** For things that have no link, like a private repository. */
  note?: string;
}

/**
 * Compact header for a case study. Part 6.8: title, one-line summary, status,
 * the stack in mono, then the links. The narrative starts straight after.
 */
export default function CaseStudyHeader({
  title,
  summary,
  status,
  stack,
  links,
}: {
  title: string;
  summary: ReactNode;
  status: string;
  stack: string;
  links: CaseLink[];
}) {
  return (
    <header className="mx-auto max-w-shell px-5 pb-4 pt-28 sm:px-6 sm:pt-36">
      <Link
        href="/#work"
        className="mono inline-flex items-center gap-2 rounded-button text-meta text-[var(--dim)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft size={13} aria-hidden="true" />
        All work
      </Link>

      <h1 className="text-title mt-6 max-w-[20ch] font-semibold text-[var(--text)]">
        {title}
      </h1>

      <p className="prose-measure mt-5 text-body-lg text-[var(--dim)]">{summary}</p>

      <dl className="mt-8 grid gap-x-10 gap-y-5 border-t border-[var(--stroke)] pt-6 sm:grid-cols-[auto_1fr]">
        <div>
          <dt className="text-meta text-[var(--dim)]">Status</dt>
          <dd className="mono mt-1.5 text-[13.5px] text-[var(--text)]">{status}</dd>
        </div>
        <div>
          <dt className="text-meta text-[var(--dim)]">Stack</dt>
          <dd className="mono mt-1.5 text-[13.5px] leading-relaxed text-[var(--text)]">
            {stack}
          </dd>
        </div>
      </dl>

      <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.href ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-button text-[15px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                {l.label}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            ) : (
              <span className="text-[15px] text-[var(--dim)]">
                {l.label}
                {l.note ? <span className="text-[var(--dim)]">: {l.note}</span> : null}
              </span>
            )}
          </li>
        ))}
      </ul>
    </header>
  );
}

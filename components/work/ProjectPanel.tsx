import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";
import Panel from "@/components/ui/Panel";
import Ledger from "@/components/ui/Ledger";
import { TagRow } from "@/components/ui/Tag";

/**
 * The panels are deliberately not the same height and are not forced into a
 * grid. The restaurant panel is visibly the largest and richest, which is how
 * a visitor knows where to look first.
 */
export default function ProjectPanel({ project }: { project: Project }) {
  const lead = project.lead === true;

  return (
    <Panel
      as="article"
      hover
      className={lead ? "p-6 sm:p-9" : "p-6 sm:p-8"}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3
          className={
            lead
              ? "text-[clamp(24px,3vw,32px)] font-semibold leading-tight tracking-[-0.025em]"
              : "text-sub font-semibold"
          }
        >
          {project.title}
        </h3>
        <span className="mono text-meta text-[var(--dim)]">{project.status}</span>
      </div>

      <p className="mono mt-2 text-meta text-[var(--dim)]">{project.meta}</p>

      <div
        className={`prose-measure mt-5 space-y-3 text-[var(--dim)] ${
          lead ? "text-body-lg" : "text-body"
        }`}
      >
        {project.summary.map((line) => (
          <p key={line.slice(0, 24)}>{line}</p>
        ))}
      </div>

      {project.metrics.length > 0 ? (
        <Ledger
          metrics={project.metrics}
          countUp={lead}
          columns={project.metrics.length === 3 ? 3 : 4}
          className="mt-7"
        />
      ) : null}

      <div className="mt-7">
        <TagRow items={project.stack} />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={`/work/${project.slug}/`}
          className="inline-flex items-center gap-2 rounded-button text-[15px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Read the case study
          <ArrowRight size={16} aria-hidden="true" />
          <span className="sr-only">for {project.title}</span>
        </Link>

        {project.demoUrl ? (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-button text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            Live demo
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : null}

        {project.repoUrl ? (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-button text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
          >
            {project.repoLabel ?? "Repository"}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </Panel>
  );
}

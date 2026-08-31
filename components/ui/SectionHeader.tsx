import type { ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";

export default function SectionHeader({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  id?: string;
}) {
  return (
    <Reveal className="mb-10">
      {eyebrow ? (
        <p className="mono mb-3 text-meta text-[var(--dim)]">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="text-section font-semibold text-[var(--text)]">
        {title}
      </h2>
      {intro ? (
        <div className="prose-measure mt-4 text-body text-[var(--dim)]">{intro}</div>
      ) : null}
    </Reveal>
  );
}

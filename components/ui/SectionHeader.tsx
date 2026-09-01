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
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2
        id={id}
        className="marks inline-block pb-1 pl-3 pr-6 pt-1 text-section font-semibold text-[var(--text)]"
      >
        {title}
      </h2>
      {intro ? (
        <div className="prose-measure mt-4 text-body text-[var(--dim)]">{intro}</div>
      ) : null}
    </Reveal>
  );
}

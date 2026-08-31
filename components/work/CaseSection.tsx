import type { ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";

/**
 * A section of a case study. Prose gets a measure and no card chrome: panels
 * are for grouped objects, not for paragraphs.
 */
export default function CaseSection({
  id,
  title,
  children,
  wide = false,
}: {
  id: string;
  title: string;
  children: ReactNode;
  /** Set for sections holding a table or a diagram rather than prose. */
  wide?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 pt-16">
      <Reveal>
        <h2
          id={`${id}-heading`}
          className="text-section font-semibold text-[var(--text)]"
        >
          {title}
        </h2>
      </Reveal>
      <Reveal className={wide ? "mt-6" : "prose-measure mt-6 text-body text-[var(--dim)]"}>
        {children}
      </Reveal>
    </section>
  );
}

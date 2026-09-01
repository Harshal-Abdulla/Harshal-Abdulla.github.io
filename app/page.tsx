import { ArrowDown, ArrowUpRight, Download } from "lucide-react";
import { PROFILE } from "@/content/profile";
import { PROJECTS, ALSO_BUILT } from "@/content/projects";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/motion/Reveal";
import ProjectPanel from "@/components/work/ProjectPanel";
import StackedCards from "@/components/work/StackedCards";

export default function Home() {
  const [lead, ...rest] = PROJECTS;

  return (
    <>
      {/* ---------------------------------------------------------------
          Hero. Part 6.2: chip, headline, supporting sentence, two buttons,
          and nothing else. All four fit above the fold at 390px wide.
          No photograph, no emoji, no scroll indicator, no illustration.
          It is not wrapped in a Reveal: first paint shows the real text.
      --------------------------------------------------------------- */}
      <section className="mx-auto flex min-h-[100svh] max-w-shell flex-col justify-center px-5 pb-16 pt-28 sm:px-6 sm:pt-32">
        <p className="panel mono mb-7 inline-flex w-fit items-center gap-2.5 rounded-full px-3.5 py-2 text-[12.5px] text-[var(--dim)]">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--ok)]"
            aria-hidden="true"
          />
          {PROFILE.availability}
        </p>

        <h1 className="text-hero max-w-[16ch] font-semibold text-[var(--text)] sm:max-w-[18ch]">
          {PROFILE.headline}
        </h1>

        <p className="mt-6 max-w-[60ch] text-body-lg text-[var(--dim)]">
          <span className="text-[var(--text)]">{PROFILE.supporting.lead}</span>
          {PROFILE.supporting.leadRest}
          <span className="text-[var(--text)]">{PROFILE.supporting.second}</span>
          {PROFILE.supporting.secondRest}
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="#work">
            See the work
            <ArrowDown size={16} aria-hidden="true" />
          </Button>
          {/* Real download. To replace the PDF, see PROFILE.cvPath. */}
          <Button href={PROFILE.cvPath} variant="glass" download>
            <Download size={16} aria-hidden="true" />
            Download CV (PDF, {PROFILE.cvSize})
          </Button>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Work
      --------------------------------------------------------------- */}
      <section
        id="work"
        aria-labelledby="work-heading"
        className="mx-auto max-w-shell scroll-mt-28 px-5 py-8 sm:px-6"
      >
        <SectionHeader
          eyebrow="Selected work"
          id="work-heading"
          title="Three things I built, and what was hard about each"
          intro={
            <p>
              The stack is a footnote. What is worth your time is the reasoning:
              what the constraint was, what I chose, and what I gave up to get it.
            </p>
          }
        />

        <StackedCards>
          <div className="flex flex-col gap-6">
            <Reveal>
              <ProjectPanel project={lead} />
            </Reveal>
            {rest.map((project, i) => (
              <Reveal key={project.slug} delay={0.07 * (i + 1)}>
                <ProjectPanel project={project} />
              </Reveal>
            ))}
          </div>
        </StackedCards>

        {/* Also built. Not panelled: these are a compact block, not objects
            competing with the three above. */}
        <Reveal className="mt-16">
          <h3 className="text-sub font-semibold text-[var(--text)]">Also built</h3>
          <div className="mt-6 grid gap-8 border-t border-[var(--stroke)] pt-7 sm:grid-cols-2 sm:gap-10">
            {ALSO_BUILT.map((item) => (
              <div key={item.title}>
                <h4 className="text-body font-semibold text-[var(--text)]">
                  {item.title}
                </h4>
                <p className="mono mt-1.5 text-meta text-[var(--dim)]">{item.meta}</p>
                <div className="mt-3 space-y-2.5 text-body text-[var(--dim)]">
                  {item.lines.map((line) => (
                    <p key={line.slice(0, 24)}>{line}</p>
                  ))}
                </div>
                {item.demoUrl || item.repoUrl ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {item.demoUrl ? (
                      <a
                        href={item.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-button text-[15px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                      >
                        {item.title === "Solas" ? "Download the app" : "Live demo"}
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ) : null}
                    {item.repoUrl ? (
                      <a
                        href={item.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-button text-[15px] text-[var(--dim)] transition-colors hover:text-[var(--text)]"
                      >
                        Repository
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}

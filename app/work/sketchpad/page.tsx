import type { Metadata } from "next";
import { projectBySlug } from "@/content/projects";
import CaseStudyHeader from "@/components/work/CaseStudyHeader";
import CaseSection from "@/components/work/CaseSection";
import Panel from "@/components/ui/Panel";

const project = projectBySlug("sketchpad");

export const metadata: Metadata = {
  title: "Sketchpad Retro",
  description:
    "A browser rebuild of Ivan Sutherland's 1963 Sketchpad. Constraint solver, geometry engine and undo stack written from scratch, with the whole interface drawn and edited in SVG.",
};

export default function SketchpadCaseStudy() {
  return (
    <>
      <CaseStudyHeader
        title="Sketchpad Retro"
        summary="A browser rebuild of Ivan Sutherland's 1963 Sketchpad, the system that invented most of what a drawing program still does today."
        status={project.status}
        stack="Next.js 14 · React · TypeScript · SVG"
        links={[
          { label: "Try the simulator", href: project.demoUrl },
          { label: "Repository", href: project.repoUrl },
          { label: "Individual MSc project", note: "Maynooth University, 2025" },
        ]}
      />

      <div className="mx-auto max-w-shell px-5 pb-8 sm:px-6">
        <div className="max-w-[760px]">
          <CaseSection id="what" title="What it is">
            <p>
              Sutherland&apos;s Sketchpad let you draw a shape and then tell the
              computer what had to stay true about it. Say two lines are
              perpendicular and they stay perpendicular while you drag either one.
              I rebuilt that in a browser.
            </p>
            <p>
              The constraint solver, the geometry engine and the undo and redo
              stack are all written from scratch, and the whole interface is drawn
              and edited in SVG.
            </p>
          </CaseSection>

          <CaseSection id="constraints" title="What it does" wide>
            <div className="prose-measure text-body text-[var(--dim)]">
              <p>
                Geometric primitives with constraints on top of them:
                parallelism, perpendicularity, equal length and fixed distance.
                Snapping and zooming. Symbols and instances, so a shape can be
                defined once and reused. State persists through JSON import and
                export and through local storage.
              </p>
            </div>

            {/* A diagram rather than a screenshot. It explains what a constraint
                does in one glance, which a screenshot of the canvas does not, and
                the real thing is one click away at the top of this page. */}
            <Panel className="mt-8 p-6 sm:p-8">
              <p className="mono text-meta text-[var(--dim)]">
                What a constraint means here
              </p>
              <svg
                viewBox="0 0 560 190"
                role="img"
                aria-labelledby="sk-title sk-desc"
                className="mt-5 h-auto w-full"
              >
                <title id="sk-title">Before and after a perpendicular constraint</title>
                <desc id="sk-desc">
                  On the left, two lines drawn freehand meet at an approximate
                  angle. On the right, the same two lines after a perpendicular
                  constraint is applied: the solver has moved one of them so the
                  angle is exactly ninety degrees, and it stays that way while
                  either line is dragged.
                </desc>

                <text x="10" y="16" className="mono" fontSize="10.5" fill="var(--dim)">
                  drawn freehand
                </text>
                <line x1="30" y1="150" x2="170" y2="60" stroke="var(--dim)" strokeWidth="2" />
                <line x1="90" y1="40" x2="200" y2="140" stroke="var(--dim)" strokeWidth="2" />
                <circle cx="30" cy="150" r="4" fill="var(--dim)" />
                <circle cx="170" cy="60" r="4" fill="var(--dim)" />
                <circle cx="90" cy="40" r="4" fill="var(--dim)" />
                <circle cx="200" cy="140" r="4" fill="var(--dim)" />

                <text x="272" y="100" className="mono" fontSize="11" fill="var(--accent)">
                  ⟶
                </text>
                <text x="262" y="122" className="mono" fontSize="10" fill="var(--dim)">
                  solve
                </text>

                <text x="350" y="16" className="mono" fontSize="10.5" fill="var(--accent)">
                  perpendicular, and it stays that way
                </text>
                <line x1="360" y1="150" x2="480" y2="70" stroke="var(--accent)" strokeWidth="2" />
                <line x1="404" y1="46" x2="470" y2="145" stroke="var(--accent)" strokeWidth="2" />
                <rect
                  x="418"
                  y="86"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  transform="rotate(-33 426 94)"
                />
                <circle cx="360" cy="150" r="4" fill="var(--accent)" />
                <circle cx="480" cy="70" r="4" fill="var(--accent)" />
                <circle cx="404" cy="46" r="4" fill="var(--accent)" />
                <circle cx="470" cy="145" r="4" fill="var(--accent)" />
              </svg>
            </Panel>
          </CaseSection>

          <CaseSection id="hard" title="What was actually hard">
            <p>
              Very little of this was a styling problem. It was a state problem.
            </p>
            <p>
              Shapes depend on each other, and the dependencies are circular by
              nature: move a point and the solver moves the lines attached to it,
              which moves the points attached to those. Doing that while a user is
              mid-drag, and keeping undo coherent through it, is the whole
              difficulty. React does not hand you that for free.
            </p>
          </CaseSection>
        </div>
      </div>
    </>
  );
}

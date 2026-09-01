import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PROFILE } from "@/content/profile";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Harshal Abdulla. MSc Computer Science from Maynooth University, First Class Honours. Based in Leixlip, Co. Kildare. Looking for associate software engineer roles in Ireland.",
};

/**
 * Short, and chronological. The timeline treatment is used here and nowhere
 * else on the site, because this is the only content that genuinely is a
 * chronology. No photograph.
 */
export default function About() {
  return (
    <div className="mx-auto max-w-shell px-5 pb-8 pt-28 sm:px-6 sm:pt-36">
      <div className="max-w-[760px]">
        <p className="eyebrow mb-4">About</p>
        <h1 className="marks inline-block pb-1 pl-3 pr-6 pt-1 text-title font-semibold text-[var(--text)]">
          Harshal Abdulla
        </h1>

        <div className="prose-measure mt-6 space-y-4 text-body-lg text-[var(--dim)]">
          <p>
            I am a software engineer in {PROFILE.location.replace(", Ireland", "")},
            Ireland. I finished an MSc in Computer Science at Maynooth last year,
            and I spend most of my time on a commercial ordering system that runs
            in a restaurant every day.
          </p>
          <p>
            I am looking for an associate or graduate software engineer role in
            Ireland, and I am available now.
          </p>
        </div>

        {/* Experience */}
        <Section title="Experience">
          {PROFILE.experience.map((job) => (
            <TimelineItem
              key={job.company}
              period={job.period}
              heading={job.role}
              sub={`${job.company} · ${job.type}`}
            >
              {job.lines.map((line) => (
                <p key={line.slice(0, 20)}>{line}</p>
              ))}
            </TimelineItem>
          ))}
        </Section>

        {/* Education */}
        <Section title="Education">
          {PROFILE.education.map((ed) => (
            <TimelineItem
              key={ed.degree}
              period={ed.period}
              heading={ed.degree}
              sub={`${ed.institution} · ${ed.location}`}
              badge={ed.grade}
            >
              <ul className="mt-1 space-y-1.5">
                {ed.modules.map((mod) => (
                  <li key={mod} className="text-body text-[var(--dim)]">
                    {mod}
                  </li>
                ))}
              </ul>
            </TimelineItem>
          ))}
        </Section>

        {/* Certifications */}
        <Section title="Certifications">
          {PROFILE.certifications.map((cert) => (
            <TimelineItem key={cert.name} period={cert.date} heading={cert.name} />
          ))}
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <p className="text-body text-[var(--dim)]">
            <a
              href={`mailto:${PROFILE.email}`}
              className="text-[var(--text)] underline decoration-[var(--stroke-bright)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
            >
              {PROFILE.email}
            </a>
            {" is the fastest way to reach me. I am also on "}
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text)] underline decoration-[var(--stroke-bright)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
            >
              GitHub
            </a>
            {" and "}
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text)] underline decoration-[var(--stroke-bright)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
            >
              LinkedIn
            </a>
            .
          </p>

          {/* Third and last place the CV appears. See PROFILE.cvPath to replace it. */}
          <div className="mt-7">
            <Button href={PROFILE.cvPath} download>
              <Download size={16} aria-hidden="true" />
              Download CV (PDF, {PROFILE.cvSize})
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="mt-16">
      <p className="eyebrow mb-4">{title}</p>
      <h2 className="sr-only">{title}</h2>
      <div className="space-y-10 border-t border-[var(--stroke)] pt-7">
        {children}
      </div>
    </Reveal>
  );
}

function TimelineItem({
  period,
  heading,
  sub,
  badge,
  children,
}: {
  period: string;
  heading: string;
  sub?: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-2 sm:grid-cols-[150px_1fr]">
      <p className="mono pt-1 text-[11.5px] uppercase tracking-[0.1em] text-[var(--dim)]">{period}</p>
      <div>
        <h3 className="text-sub font-semibold text-[var(--text)]">{heading}</h3>
        {sub ? <p className="mt-1 text-body text-[var(--dim)]">{sub}</p> : null}
        {badge ? (
          <p className="mono mt-2 inline-block rounded-tag border border-[var(--stroke)] bg-[var(--glass)] px-2 py-1 text-[11.5px] text-[var(--accent)]">
            {badge}
          </p>
        ) : null}
        {children ? (
          <div className="prose-measure mt-3 space-y-2 text-body text-[var(--dim)]">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

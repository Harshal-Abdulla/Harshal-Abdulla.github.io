import type { Metadata } from "next";
import {
  projectBySlug,
  NOTIFICATION_PROBLEMS,
  NOTIFICATION_NEXT,
} from "@/content/projects";
import CaseStudyHeader from "@/components/work/CaseStudyHeader";
import CaseSection from "@/components/work/CaseSection";
import SubNav from "@/components/work/SubNav";
import KafkaDiagram from "@/components/work/KafkaDiagram";

const project = projectBySlug("notifications");

export const metadata: Metadata = {
  title: "Fault-tolerant notification system",
  description:
    "A distributed notification pipeline built so a message is never silently lost and never delivered twice, even when the broker, the database or the consumer crashes mid-flight.",
};

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "problem", label: "The problem" },
  { id: "architecture", label: "Architecture" },
  { id: "consumer", label: "What the consumer does" },
  { id: "three", label: "Three problems solved" },
  { id: "why-both", label: "Postgres and Redis" },
  { id: "next", label: "What is next" },
];

export default function NotificationsCaseStudy() {
  return (
    <>
      <CaseStudyHeader
        title="A message that is never lost and never sent twice"
        summary="A distributed notification pipeline that holds its guarantees when the broker, the database or the consumer process dies partway through the job."
        status={project.status}
        stack="Python · Apache Kafka · PostgreSQL · Redis · Docker Compose"
        links={[{ label: "Repository", href: project.repoUrl }]}
      />

      <div className="mx-auto grid max-w-shell gap-x-14 px-5 pb-8 sm:px-6 lg:grid-cols-[1fr_210px]">
        <div className="min-w-0 lg:order-1">
          <CaseSection id="what" title="What it is">
            <p>
              A notification delivery system that guarantees a message is never
              silently lost and never delivered twice, even when the broker, the
              database or the consumer process crashes mid-flight.
            </p>
            <p>
              The delivery path is built: the producer writes a PENDING row and
              commits before it publishes, and the consumer reads that row's
              status before it acts, so a duplicate is a no-op rather than a
              second send.
            </p>
            <p>
              The failure path is designed but not written yet. The retry
              branch below, the attempt counters in Redis and the dead-letter
              queue are how it will work, not how it currently works. I would
              rather say that than let you find out by reading the repository.
            </p>
          </CaseSection>

          <CaseSection id="problem" title="The problem">
            <p>
              The naive version is one function that sends a notification. It
              breaks three ways and all three happen in production.
            </p>
            <p>
              The process dies partway through and nobody can say whether the
              message went out. A service goes down and the in-flight messages
              evaporate with no record that they existed. Traffic spikes, and
              because the sender is wired straight to delivery, one slow provider
              pushes back-pressure into the request path.
            </p>
            <p>
              Kafka fixes the coupling and the buffering. It does not fix the
              first problem. Kafka guarantees at-least-once delivery, which means
              the same message ID can and will arrive twice. That duplicate is the
              real design problem, and it is where most of the work went.
            </p>
          </CaseSection>

          <CaseSection id="architecture" title="Write before publish" wide>
            <div className="prose-measure text-body text-[var(--dim)]">
              <p>
                The producer writes a PENDING row to Postgres before it publishes
                to Kafka. That ordering is the foundation and everything else is
                built on top of it.
              </p>
              <p>
                If the process dies after the insert and before the publish, the
                row is still sitting there and a recovery sweep picks it up using
                the row timestamps. Reverse the two and a crash leaves a message
                in flight with no durable record that it ever existed, which is
                the failure nobody can debug afterwards.
              </p>
            </div>
          </CaseSection>

          <CaseSection id="consumer" title="What the consumer does" wide>
            <p className="prose-measure mb-7 text-body text-[var(--dim)]">
              On every message the consumer reads the row&apos;s status first, then
              acts. That SELECT before the UPDATE is what makes it idempotent by
              design rather than idempotent by accident.
            </p>
            <KafkaDiagram />
            <p className="prose-measure mt-7 text-body text-[var(--dim)]">
              PENDING and FAILED are not interchangeable. One means never
              attempted and the other means attempted and failed. Collapse them
              into a single status and you throw away the information the retry
              logic runs on.
            </p>
          </CaseSection>

          <CaseSection id="three" title="Three problems, and what each one costs" wide>
            <ol className="space-y-9">
              {NOTIFICATION_PROBLEMS.map((p) => (
                <li key={p.n} className="grid gap-x-5 sm:grid-cols-[auto_1fr]">
                  <span className="index pt-1">{p.n}</span>
                  <div className="prose-measure">
                    <h3 className="text-sub font-semibold text-[var(--text)]">{p.title}</h3>
                    <p className="mt-2 text-body text-[var(--dim)]">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CaseSection>

          <CaseSection id="why-both" title="Why both Postgres and Redis">
            <p>
              Postgres is the source of truth and it is written on every message,
              always. Redis is fast and forgettable. Losing it costs speed and
              never costs correctness.
            </p>
            <p>
              It is a performance layer, not a backup, and it is worth being
              precise about that because the two get confused constantly. If Redis
              disappears the retry counts go with it and delivery gets slower.
              Nothing becomes wrong.
            </p>
            <p>
              Retries use exponential backoff, then a dead-letter queue once the
              attempts are spent, so one poison message cannot hold a partition
              hostage.
            </p>
          </CaseSection>

          <CaseSection id="next" title="What is next">
            <ul className="space-y-4">
              {NOTIFICATION_NEXT.map((item) => (
                <li key={item.slice(0, 20)} className="border-l border-[var(--stroke-bright)] pl-4">
                  {item}
                </li>
              ))}
            </ul>
          </CaseSection>
        </div>

        <div className="lg:order-2">
          <SubNav items={SECTIONS} />
        </div>
      </div>
    </>
  );
}

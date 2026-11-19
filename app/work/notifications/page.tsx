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
    "A Kafka notification pipeline in Python that skips duplicate messages, retries failed sends, and picks up where it left off when the consumer restarts.",
};

const SECTIONS = [
  { id: "what", label: "What it is" },
  { id: "problem", label: "The problem" },
  { id: "architecture", label: "Architecture" },
  { id: "consumer", label: "What the consumer does" },
  { id: "three", label: "Three problems, and what each one costs" },
  { id: "why-both", label: "Postgres and Redis" },
  { id: "next", label: "What is next" },
];

export default function NotificationsCaseStudy() {
  return (
    <>
      <CaseStudyHeader
        title="A notification pipeline that keeps working when things fail"
        summary="A Kafka notification pipeline that skips duplicate messages and retries failed sends, and picks up where it left off when the consumer restarts. It is at-least-once, not exactly-once; the known limits are below."
        status={project.status}
        stack="Python · Apache Kafka · PostgreSQL · Redis · Docker Compose"
        links={[{ label: "Repository", href: project.repoUrl }]}
      />

      <div className="mx-auto grid max-w-shell gap-x-14 px-5 pb-8 sm:px-6 lg:grid-cols-[1fr_210px]">
        <div className="min-w-0 lg:order-1">
          <CaseSection id="what" title="What it is">
            <p>
              A notification pipeline in Python that keeps working when things
              fail: a consumer that crashes, a send that fails, or a message that
              Kafka delivers twice.
            </p>
            <p>
              The producer writes a PENDING row and commits before it publishes,
              and the consumer reads that row&apos;s status before it acts, so a
              message that was already sent is skipped rather than sent again. A
              failed send is retried after 1, 2, 4, 8 and 16 seconds, Redis keeps
              the attempt count with an atomic INCR, and after the sixth failure
              the id goes to the dead letter topic notifications-dlq and the
              row is marked FAILED.
            </p>
            <p>
              Two limits are worth knowing. It is at-least-once, not
              exactly-once: if the consumer crashes after a send succeeds but
              before the row is marked SENT, that notification goes out twice.
              And if the producer crashes between saving the row and publishing
              it, the row stays PENDING, because the job that would republish it
              is not built yet.
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
                row is still sitting there as PENDING, so there is a record to
                recover from. The job that would republish it is not built yet.
                Reverse the two and a crash leaves a message
                in flight with no durable record that it ever existed, which is
                the failure nobody can debug afterwards.
              </p>
            </div>
          </CaseSection>

          <CaseSection id="consumer" title="What the consumer does" wide>
            <p className="prose-measure mb-7 text-body text-[var(--dim)]">
              On every message the consumer reads the row&apos;s status first, then
              acts. That SELECT before the UPDATE is what makes it idempotent by
              design rather than idempotent by accident. The consumer runs in
              group notification-workers, so Kafka saves its offset and a
              restarted consumer carries on where it stopped.
            </p>
            <KafkaDiagram />
            <p className="prose-measure mt-7 text-body text-[var(--dim)]">
              PENDING and FAILED are not interchangeable. One means not sent yet
              and the other means it failed six times and was given up on.
              Collapse them and a message that has already been dead-lettered
              would be retried all over again.
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
              always. Redis is fast and forgettable. Losing it can cost a few
              extra retries, and it never makes a status wrong.
            </p>
            <p>
              It is a performance layer, not a backup, and it is worth being
              precise about that because the two get confused constantly. If Redis
              disappears the retry counts go with it, so a notification may get a
              few extra retries. The final status is still correct.
            </p>
            <p>
              After the fifth retry, about 31 seconds in, the id goes to the dead
              letter topic notifications-dlq, so a message that keeps failing does not loop
              forever. While it waits, though, the consumer waits with it: the
              backoff is a plain sleep, so the messages behind it are held up.
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

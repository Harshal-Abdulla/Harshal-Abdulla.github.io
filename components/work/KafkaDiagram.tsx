"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { CONSUMER_DECISIONS, type ConsumerState } from "@/content/projects";

/* ---------------------------------------------------------------------------
   Geometry. One place to move a box.
--------------------------------------------------------------------------- */

const W = 660;
const H = 404;

type NodeId = "producer" | "postgres" | "kafka" | "consumer" | "redis" | "dlq";

const NODES: Record<NodeId, { x: number; y: number; label: string; sub: string }> = {
  producer: { x: 96, y: 52, label: "Producer", sub: "" },
  postgres: { x: 540, y: 52, label: "PostgreSQL", sub: "source of truth" },
  kafka: { x: 318, y: 196, label: "Kafka", sub: "" },
  consumer: { x: 540, y: 196, label: "Consumer", sub: "" },
  redis: { x: 540, y: 336, label: "Redis", sub: "retry counters" },
  dlq: { x: 318, y: 336, label: "Dead-letter queue", sub: "" },
};

const BOX_W = 152;
const BOX_H = 56;

const pt = (id: NodeId): [number, number] => [NODES[id].x, NODES[id].y];

/* ---------------------------------------------------------------------------
   Branches. Each leg is one hop the token makes, the nodes it lights up, and
   the single line explaining what just happened.
--------------------------------------------------------------------------- */

interface Leg {
  from: NodeId;
  to: NodeId;
  /** Optional elbow waypoint, so the token follows the drawn connector. */
  via?: [number, number];
  ms: number;
  lit: NodeId[];
  say: string;
  bumpRetry?: boolean;
  /** The token fades out at the end of this leg rather than resting. */
  vanish?: boolean;
}

const WRITE: Leg = {
  from: "producer",
  to: "postgres",
  ms: 900,
  lit: ["producer", "postgres"],
  say: "[1] The producer writes a PENDING row to Postgres. This happens before anything is published.",
};

const PUBLISH: Leg = {
  from: "producer",
  to: "kafka",
  via: [96, 196],
  ms: 900,
  lit: ["producer", "kafka"],
  say: "[2] Only now does the producer publish to Kafka. Crash between the two and the row is still there for the recovery sweep.",
};

const CONSUME: Leg = {
  from: "kafka",
  to: "consumer",
  ms: 800,
  lit: ["kafka", "consumer"],
  say: "[3] The consumer picks the message up. Kafka has done its job and may well deliver this same message again.",
};

const READ: Leg = {
  from: "consumer",
  to: "postgres",
  ms: 800,
  lit: ["consumer", "postgres"],
  say: "The consumer reads the row's status before it does anything else. This is the SELECT before the UPDATE.",
};

const BRANCHES: Record<ConsumerState, Leg[]> = {
  NO_ROW: [
    PUBLISH,
    CONSUME,
    READ,
    {
      from: "postgres",
      to: "consumer",
      ms: 800,
      lit: ["consumer"],
      say: "No row. Every legitimate message is guaranteed a PENDING row, so this one is not real. It is dropped, and dropping it is safe by construction.",
      vanish: true,
    },
  ],
  PENDING: [
    WRITE,
    PUBLISH,
    CONSUME,
    READ,
    {
      from: "postgres",
      to: "consumer",
      ms: 800,
      lit: ["consumer"],
      say: "PENDING. The notification is delivered, and only once delivery is confirmed does the row flip to SENT.",
    },
    {
      from: "consumer",
      to: "postgres",
      ms: 800,
      lit: ["consumer", "postgres"],
      say: "Row updated to SENT after the fact, never before it. Marking an unsent message as sent is the one lie this system must not tell.",
      vanish: true,
    },
  ],
  SENT: [
    CONSUME,
    READ,
    {
      from: "postgres",
      to: "consumer",
      ms: 900,
      lit: ["consumer"],
      say: "Already SENT. This is the duplicate Kafka warned us about, and the guard catches it. Reprocessing is a no-op, not a second send.",
      vanish: true,
    },
  ],
  FAILED: [
    // Starts at the producer, like every other branch. The row exists and was
    // published normally; what makes this branch different is what the consumer
    // finds when it looks, not how the message got there.
    WRITE,
    PUBLISH,
    CONSUME,
    READ,
    {
      from: "postgres",
      to: "consumer",
      ms: 700,
      lit: ["consumer"],
      say: "FAILED means tried and failed, which is not the same thing as never attempted. The retry path takes over.",
    },
    {
      from: "consumer",
      to: "redis",
      ms: 600,
      lit: ["consumer", "redis"],
      say: "Attempt 1 recorded in Redis. The count lives outside the process, because process memory resets to zero on restart.",
      bumpRetry: true,
    },
    {
      from: "redis",
      to: "consumer",
      ms: 600,
      lit: ["consumer", "redis"],
      say: "Backoff, then retry. Delivery fails again.",
    },
    {
      from: "consumer",
      to: "redis",
      ms: 600,
      lit: ["consumer", "redis"],
      say: "Attempt 2. The interval grows each time, so a struggling provider is not hammered.",
      bumpRetry: true,
    },
    {
      from: "redis",
      to: "consumer",
      ms: 600,
      lit: ["consumer", "redis"],
      say: "Backoff, then retry. Still failing.",
    },
    {
      from: "consumer",
      to: "redis",
      ms: 600,
      lit: ["consumer", "redis"],
      say: "Attempt 3. Attempts are now exhausted.",
      bumpRetry: true,
    },
    {
      from: "consumer",
      to: "dlq",
      ms: 950,
      lit: ["consumer", "dlq"],
      say: "Dead-lettered. One poison message cannot block the partition forever, and there is a durable record of what went wrong.",
      vanish: true,
    },
  ],
};

/* ---------------------------------------------------------------------------
   Component
--------------------------------------------------------------------------- */

export default function KafkaDiagram() {
  const reduced = useReducedMotion();
  const [branch, setBranch] = useState<ConsumerState | null>(null);
  const [leg, setLeg] = useState(0);
  const [retries, setRetries] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const invited = useRef(false);

  const legs = branch ? BRANCHES[branch] : [];
  const current: Leg | undefined = legs[leg];
  const done = branch !== null && leg >= legs.length;

  const select = useCallback((next: ConsumerState) => {
    setBranch(next);
    setLeg(0);
    setRetries(0);
  }, []);

  // Pauses when off-screen. It also plays the PENDING branch once as an
  // invitation the first time it is scrolled to, and then never again on its
  // own: after that it answers a click and nothing else.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !invited.current && !reduced) {
          invited.current = true;
          select("PENDING");
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, select]);

  // Advance one leg at a time. Nothing runs while the diagram is off-screen.
  useEffect(() => {
    if (reduced || !inView || !current) return;

    if (current.bumpRetry) setRetries((r) => r + 1);

    const t = window.setTimeout(() => setLeg((i) => i + 1), current.ms);
    return () => window.clearTimeout(t);
  }, [reduced, inView, current, leg]);

  // Which boxes are lit, and what the caption says.
  const lit: NodeId[] = reduced && branch ? litForWholeBranch(branch) : (current?.lit ?? []);
  const caption = reduced && branch
    ? BRANCHES[branch][BRANCHES[branch].length - 1].say
    : (current?.say ?? (done ? legs[legs.length - 1].say : ""));
  const shownRetries = reduced && branch === "FAILED" ? 3 : retries;

  const tokenTarget = current
    ? tokenKeyframes(current)
    : null;

  return (
    <div
      ref={rootRef}
      className="panel overflow-hidden p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-sub font-semibold text-[var(--text)]">
          What the consumer does, and why
        </h3>
        <p className="mono text-meta text-[var(--dim)]">
          Redis retry count: <span className="text-[var(--text)]">{shownRetries}</span>
        </p>
      </div>

      <p className="mt-2 max-w-[62ch] text-body text-[var(--dim)]">
        Pick a status for the row the consumer finds. The message follows the path
        it would really take.
      </p>

      {/* Controls. Real buttons, keyboard operable, with the pressed state
          exposed rather than only drawn. */}
      <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Consumer states">
        {CONSUMER_DECISIONS.map((d) => {
          const active = branch === d.state;
          return (
            <button
              key={d.state}
              type="button"
              onClick={() => select(d.state)}
              aria-pressed={active}
              className={`mono rounded-button border px-3.5 py-2 text-[13px] transition-all duration-[180ms] ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] font-medium text-[#0B0E14]"
                  : "border-[var(--stroke)] bg-[var(--glass)] text-[var(--text)] hover:border-[var(--stroke-bright)] hover:bg-[var(--glass-strong)]"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* The diagram. */}
      <div className="mt-7 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="kafka-svg-title kafka-svg-desc"
          className="h-auto w-full min-w-[560px]"
        >
          <title id="kafka-svg-title">
            Architecture of the notification pipeline
          </title>
          <desc id="kafka-svg-desc">
            The producer writes a PENDING row to PostgreSQL, then publishes to
            Kafka. A consumer reads from Kafka, checks the row status in
            PostgreSQL, and either delivers the notification, drops it, skips it
            as a duplicate, or retries it using counters held in Redis before
            routing it to a dead-letter queue. The same information is in the
            table below this diagram.
          </desc>

          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--stroke-bright)" />
            </marker>
          </defs>

          {/* Connectors, drawn once and never animated. */}
          <Edge d={`M ${172} 52 H ${464}`} label="[1] write PENDING" lx={318} ly={40} />
          <Edge d={`M 96 80 V 196 H ${242}`} label="[2] publish" lx={112} ly={140} anchor="start" />
          <Edge d={`M ${394} 196 H ${464}`} label="[3] consume" lx={429} ly={184} />
          <Edge d={`M ${540} 168 V 80`} label="read status" lx={552} ly={128} anchor="start" />
          <Edge d={`M ${540} 224 V 308`} label="retry count" lx={552} ly={270} anchor="start" />
          <Edge d={`M ${464} 336 H ${394}`} label="exhausted" lx={429} ly={324} />

          {/* Boxes. */}
          {(Object.keys(NODES) as NodeId[]).map((id) => (
            <Box key={id} id={id} lit={lit.includes(id)} />
          ))}

          {/* The travelling token. Never rendered under reduced motion. */}
          {!reduced && tokenTarget ? (
            <m.circle
              r="7"
              fill="var(--accent)"
              initial={false}
              animate={{
                cx: tokenTarget.cx,
                cy: tokenTarget.cy,
                opacity: current?.vanish ? [1, 1, 0] : 1,
              }}
              transition={{
                duration: (current?.ms ?? 800) / 1000,
                ease: "easeInOut",
              }}
            />
          ) : null}
        </svg>
      </div>

      {/* One line on what just happened. Announced, not only drawn. */}
      <p
        aria-live="polite"
        className="mt-5 min-h-[3.2rem] max-w-[68ch] border-l-2 border-[var(--accent)] pl-4 text-body text-[var(--dim)]"
      >
        {caption || "Pick a state above to run the message through."}
      </p>

      {/* The text equivalent. Nothing on this diagram is conveyed by the
          animation alone. */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">
            What the consumer does for each row status it finds
          </caption>
          <thead>
            <tr className="border-b border-[var(--stroke)]">
              <th scope="col" className="pb-3 pr-4 text-meta font-normal text-[var(--dim)]">
                Status found
              </th>
              <th scope="col" className="pb-3 pr-4 text-meta font-normal text-[var(--dim)]">
                Action
              </th>
              <th scope="col" className="pb-3 text-meta font-normal text-[var(--dim)]">
                Why
              </th>
            </tr>
          </thead>
          <tbody>
            {CONSUMER_DECISIONS.map((d) => {
              const active = branch === d.state;
              return (
                <tr
                  key={d.state}
                  aria-current={active ? "true" : undefined}
                  className={`border-b border-[var(--stroke)] transition-colors last:border-b-0 ${
                    active ? "bg-[var(--glass-strong)]" : ""
                  }`}
                >
                  <th
                    scope="row"
                    className={`mono py-4 pr-4 align-top text-[13px] font-normal ${
                      active ? "text-[var(--accent)]" : "text-[var(--text)]"
                    }`}
                  >
                    {d.label}
                  </th>
                  <td
                    className={`py-4 pr-4 align-top text-body ${
                      d.tone === "ok"
                        ? "text-[var(--ok)]"
                        : d.tone === "fail"
                          ? "text-[var(--fail)]"
                          : "text-[var(--text)]"
                    }`}
                  >
                    {d.action}
                  </td>
                  <td className="py-4 align-top text-body text-[var(--dim)]">{d.why}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Pieces
--------------------------------------------------------------------------- */

function Edge({
  d,
  label,
  lx,
  ly,
  anchor = "middle",
}: {
  d: string;
  label: string;
  lx: number;
  ly: number;
  anchor?: "middle" | "start";
}) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="var(--stroke-bright)"
        strokeWidth="1"
        markerEnd="url(#arrow)"
      />
      <text
        x={lx}
        y={ly}
        textAnchor={anchor}
        className="mono"
        fontSize="10.5"
        fill="var(--dim)"
      >
        {label}
      </text>
    </g>
  );
}

function Box({ id, lit }: { id: NodeId; lit: boolean }) {
  const n = NODES[id];
  return (
    <g>
      <rect
        x={n.x - BOX_W / 2}
        y={n.y - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx="10"
        fill={lit ? "rgba(240,165,56,0.13)" : "rgba(255,255,255,0.045)"}
        stroke={lit ? "var(--accent)" : "var(--stroke)"}
        strokeWidth="1"
        style={{ transition: "fill 180ms ease, stroke 180ms ease" }}
      />
      <text
        x={n.x}
        y={n.sub ? n.y - 2 : n.y + 4}
        textAnchor="middle"
        fontSize="13.5"
        fontWeight="500"
        fill="var(--text)"
      >
        {n.label}
      </text>
      {n.sub ? (
        <text
          x={n.x}
          y={n.y + 14}
          textAnchor="middle"
          className="mono"
          fontSize="10"
          fill="var(--dim)"
        >
          {n.sub}
        </text>
      ) : null}
    </g>
  );
}

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */

/** Keyframes for one leg, including the elbow waypoint where there is one. */
function tokenKeyframes(leg: Leg): { cx: number[]; cy: number[] } {
  const [fx, fy] = pt(leg.from);
  const [tx, ty] = pt(leg.to);
  if (leg.via) {
    return { cx: [fx, leg.via[0], tx], cy: [fy, leg.via[1], ty] };
  }
  return { cx: [fx, tx], cy: [fy, ty] };
}

/** Under reduced motion the whole path is lit at once rather than in sequence. */
function litForWholeBranch(branch: ConsumerState): NodeId[] {
  const set = new Set<NodeId>();
  BRANCHES[branch].forEach((l) => l.lit.forEach((n) => set.add(n)));
  return [...set];
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { m, useReducedMotion } from "framer-motion";
import { CONSUMER_DECISIONS, type ConsumerState } from "@/content/projects";

/* ---------------------------------------------------------------------------
   Geometry.

   Two layouts, because a wide diagram squeezed onto a phone is not a diagram,
   it is a horizontal scrollbar. The landscape version is the real architecture
   drawing; the portrait version says exactly the same thing in one column, so
   nothing on a phone has to be dragged sideways to be read.

   Node identity, captions and branch logic are shared. Only coordinates,
   connector paths and edge wording differ.
--------------------------------------------------------------------------- */

type NodeId = "producer" | "postgres" | "kafka" | "consumer" | "redis" | "dlq";

const LABELS: Record<NodeId, { label: string; sub: string }> = {
  producer: { label: "Producer", sub: "" },
  postgres: { label: "PostgreSQL", sub: "source of truth" },
  kafka: { label: "Kafka", sub: "" },
  consumer: { label: "Consumer", sub: "" },
  redis: { label: "Redis", sub: "retry counters" },
  dlq: { label: "Dead-letter queue", sub: "" },
};

interface EdgeSpec {
  d: string;
  label: string;
  lx: number;
  ly: number;
  anchor?: "middle" | "start" | "end";
}

interface Layout {
  w: number;
  h: number;
  boxW: number;
  boxH: number;
  titleSize: number;
  subSize: number;
  edgeSize: number;
  nodes: Record<NodeId, { x: number; y: number }>;
  edges: EdgeSpec[];
  /** Waypoints the travelling token follows, keyed "from->to". */
  elbows: Record<string, [number, number][]>;
  /** Forces a horizontal scroll only when the diagram genuinely needs one. */
  minWidth: string;
}

const WIDE: Layout = {
  w: 660,
  h: 404,
  boxW: 152,
  boxH: 56,
  titleSize: 13.5,
  subSize: 10,
  edgeSize: 10.5,
  nodes: {
    producer: { x: 96, y: 52 },
    postgres: { x: 540, y: 52 },
    kafka: { x: 318, y: 196 },
    consumer: { x: 540, y: 196 },
    redis: { x: 540, y: 336 },
    dlq: { x: 318, y: 336 },
  },
  edges: [
    { d: "M 172 52 H 464", label: "[1] write PENDING", lx: 318, ly: 40 },
    { d: "M 96 80 V 196 H 242", label: "[2] publish", lx: 112, ly: 140, anchor: "start" },
    { d: "M 394 196 H 464", label: "[3] consume", lx: 429, ly: 184 },
    { d: "M 540 168 V 80", label: "read status", lx: 552, ly: 128, anchor: "start" },
    { d: "M 540 224 V 308", label: "retry count", lx: 552, ly: 270, anchor: "start" },
    { d: "M 464 336 H 394", label: "exhausted", lx: 429, ly: 324 },
  ],
  elbows: {
    "producer->kafka": [[96, 196]],
    "consumer->dlq": [[540, 336]],
  },
  minWidth: "560px",
};

const NARROW: Layout = {
  w: 340,
  h: 512,
  boxW: 96,
  boxH: 44,
  titleSize: 11,
  subSize: 7.5,
  edgeSize: 8.5,
  nodes: {
    producer: { x: 84, y: 40 },
    postgres: { x: 256, y: 40 },
    kafka: { x: 84, y: 172 },
    consumer: { x: 84, y: 304 },
    redis: { x: 256, y: 304 },
    dlq: { x: 256, y: 436 },
  },
  edges: [
    { d: "M 132 40 H 204", label: "[1] write", lx: 168, ly: 30 },
    { d: "M 84 62 V 146", label: "[2] publish", lx: 92, ly: 108, anchor: "start" },
    { d: "M 84 194 V 278", label: "[3] consume", lx: 92, ly: 240, anchor: "start" },
    { d: "M 132 292 H 170 V 50 H 204", label: "read status", lx: 176, ly: 176, anchor: "start" },
    { d: "M 132 318 H 204", label: "retry", lx: 168, ly: 336 },
    { d: "M 84 326 V 436 H 204", label: "exhausted", lx: 92, ly: 392, anchor: "start" },
  ],
  elbows: {
    "consumer->postgres": [
      [170, 304],
      [170, 50],
    ],
    "postgres->consumer": [
      [170, 50],
      [170, 304],
    ],
    "consumer->dlq": [[84, 436]],
  },
  // A portrait diagram fits a phone, so nothing is forced wider than the page.
  minWidth: "0px",
};

/* ---------------------------------------------------------------------------
   Branches. Each leg is one hop the token makes, the nodes it lights up, and
   the single line explaining what just happened.
--------------------------------------------------------------------------- */

interface Leg {
  from: NodeId;
  to: NodeId;
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

/**
 * Picks the portrait layout below 640px. useSyncExternalStore rather than
 * useEffect so the server and the first client render agree, instead of the
 * diagram visibly reflowing after hydration.
 */
function useLayout(): Layout {
  const isNarrow = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 639px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
  return isNarrow ? NARROW : WIDE;
}

export default function KafkaDiagram() {
  const reduced = useReducedMotion();
  const layout = useLayout();
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
  // own: after that it answers a tap and nothing else.
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

  const lit: NodeId[] =
    reduced && branch ? litForWholeBranch(branch) : (current?.lit ?? []);
  const caption =
    reduced && branch
      ? BRANCHES[branch][BRANCHES[branch].length - 1].say
      : (current?.say ?? (done ? legs[legs.length - 1].say : ""));
  const shownRetries = reduced && branch === "FAILED" ? 3 : retries;

  const token = current ? tokenKeyframes(current, layout) : null;

  return (
    <div ref={rootRef} className="panel overflow-hidden p-4 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-sub font-semibold text-[var(--text)]">
          What the consumer does, and why
        </h3>
        <p className="mono text-meta text-[var(--dim)]">
          Redis retry count:{" "}
          <span className="text-[var(--text)]">{shownRetries}</span>
        </p>
      </div>

      <p className="mt-2 max-w-[62ch] text-body text-[var(--dim)]">
        Pick a status for the row the consumer finds. The message follows the path
        it would really take.
      </p>

      {/* Controls. Real buttons, keyboard operable, and each one is a 44px tap
          target on a phone rather than something you have to aim at. */}
      <div
        className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap"
        role="group"
        aria-label="Consumer states"
      >
        {CONSUMER_DECISIONS.map((d) => {
          const active = branch === d.state;
          return (
            <button
              key={d.state}
              type="button"
              onClick={() => select(d.state)}
              aria-pressed={active}
              className={`mono min-h-[44px] rounded-button border px-3.5 py-2 text-[13px] transition-all duration-[180ms] ${
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

      {/* The diagram. Landscape on a laptop, portrait on a phone. */}
      <div className="mt-7 overflow-x-auto">
        <svg
          viewBox={`0 0 ${layout.w} ${layout.h}`}
          role="img"
          aria-labelledby="kafka-svg-title kafka-svg-desc"
          className="h-auto w-full"
          style={{ minWidth: layout.minWidth }}
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

          {layout.edges.map((e) => (
            <Edge key={e.label} spec={e} size={layout.edgeSize} />
          ))}

          {(Object.keys(LABELS) as NodeId[]).map((id) => (
            <Box key={id} id={id} lit={lit.includes(id)} layout={layout} />
          ))}

          {!reduced && token ? (
            <m.circle
              r={layout === NARROW ? 5.5 : 7}
              fill="var(--accent)"
              initial={false}
              animate={{
                cx: token.cx,
                cy: token.cy,
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

      <p
        aria-live="polite"
        className="mt-5 min-h-[3.2rem] max-w-[68ch] border-l-2 border-[var(--accent)] pl-4 text-body text-[var(--dim)]"
      >
        {caption || "Pick a state above to run the message through."}
      </p>

      {/* The text equivalent. On a phone each row becomes its own block, so the
          table never has to be dragged sideways either. */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left max-sm:block">
          <caption className="sr-only">
            What the consumer does for each row status it finds
          </caption>
          <thead className="max-sm:hidden">
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
          <tbody className="max-sm:block">
            {CONSUMER_DECISIONS.map((d) => {
              const active = branch === d.state;
              return (
                <tr
                  key={d.state}
                  aria-current={active ? "true" : undefined}
                  className={`border-b border-[var(--stroke)] transition-colors last:border-b-0 max-sm:mb-3 max-sm:block max-sm:rounded-panel max-sm:border max-sm:p-4 ${
                    active
                      ? "bg-[var(--glass-strong)] max-sm:border-[var(--accent)]"
                      : ""
                  }`}
                >
                  <th
                    scope="row"
                    className={`mono py-4 pr-4 align-top text-[13px] font-normal max-sm:block max-sm:py-0 ${
                      active ? "text-[var(--accent)]" : "text-[var(--text)]"
                    }`}
                  >
                    {d.label}
                  </th>
                  <td
                    className={`py-4 pr-4 align-top text-body max-sm:block max-sm:py-1 ${
                      d.tone === "ok"
                        ? "text-[var(--ok)]"
                        : d.tone === "fail"
                          ? "text-[var(--fail)]"
                          : "text-[var(--text)]"
                    }`}
                  >
                    {d.action}
                  </td>
                  <td className="py-4 align-top text-body text-[var(--dim)] max-sm:block max-sm:py-0">
                    {d.why}
                  </td>
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

function Edge({ spec, size }: { spec: EdgeSpec; size: number }) {
  return (
    <g>
      <path
        d={spec.d}
        fill="none"
        stroke="var(--stroke-bright)"
        strokeWidth="1"
        markerEnd="url(#arrow)"
      />
      <text
        x={spec.lx}
        y={spec.ly}
        textAnchor={spec.anchor ?? "middle"}
        className="mono"
        fontSize={size}
        fill="var(--dim)"
      >
        {spec.label}
      </text>
    </g>
  );
}

function Box({
  id,
  lit,
  layout,
}: {
  id: NodeId;
  lit: boolean;
  layout: Layout;
}) {
  const n = layout.nodes[id];
  const meta = LABELS[id];
  // The long name does not fit a phone-width box.
  const title = layout === NARROW && id === "dlq" ? "DLQ" : meta.label;
  const showSub = meta.sub !== "" && layout !== NARROW;

  return (
    <g>
      <rect
        x={n.x - layout.boxW / 2}
        y={n.y - layout.boxH / 2}
        width={layout.boxW}
        height={layout.boxH}
        rx="10"
        fill={lit ? "rgba(240,165,56,0.13)" : "rgba(255,255,255,0.045)"}
        stroke={lit ? "var(--accent)" : "var(--stroke)"}
        strokeWidth="1"
        style={{ transition: "fill 180ms ease, stroke 180ms ease" }}
      />
      <text
        x={n.x}
        y={showSub ? n.y - 2 : n.y + layout.titleSize / 3}
        textAnchor="middle"
        fontSize={layout.titleSize}
        fontWeight="500"
        fill="var(--text)"
      >
        {title}
      </text>
      {showSub ? (
        <text
          x={n.x}
          y={n.y + 14}
          textAnchor="middle"
          className="mono"
          fontSize={layout.subSize}
          fill="var(--dim)"
        >
          {meta.sub}
        </text>
      ) : null}
    </g>
  );
}

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */

/** Keyframes for one leg, following any elbows the active layout defines. */
function tokenKeyframes(leg: Leg, layout: Layout): { cx: number[]; cy: number[] } {
  const from = layout.nodes[leg.from];
  const to = layout.nodes[leg.to];
  const mid = layout.elbows[`${leg.from}->${leg.to}`] ?? [];

  return {
    cx: [from.x, ...mid.map((p) => p[0]), to.x],
    cy: [from.y, ...mid.map((p) => p[1]), to.y],
  };
}

/** Under reduced motion the whole path is lit at once rather than in sequence. */
function litForWholeBranch(branch: ConsumerState): NodeId[] {
  const set = new Set<NodeId>();
  BRANCHES[branch].forEach((l) => l.lit.forEach((n) => set.add(n)));
  return [...set];
}

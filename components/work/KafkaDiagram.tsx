"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { m, useReducedMotion } from "framer-motion";
import { CONSUMER_DECISIONS, type ConsumerState } from "@/content/projects";

/* ---------------------------------------------------------------------------
   The source of truth for everything this component does is the
   Kafka-Notification-System repo: app/producer.py, app/consumer.py and
   app/init.sql, as of commit 453e26a (12 Nov 2026). Every log line below is
   copied from a print() in consumer.py, and every branch is one the code
   takes. If the code changes, change this to match. Do not add behaviour the
   code does not have.

   Two layouts, because a wide diagram squeezed onto a phone is not a diagram,
   it is a horizontal scrollbar. Node identity and the steps are shared; only
   coordinates, connector paths and edge wording differ.
--------------------------------------------------------------------------- */

type NodeId = "producer" | "postgres" | "topic" | "consumer" | "redis" | "dlq";
type RowStatus = "none" | "PENDING" | "SENT" | "FAILED";
type Scenario = ConsumerState | "CRASH" | "DUP";

/** An example notification_id. producer.py makes a fresh uuid4 each run. */
const ID = "5b7e2c1a-93f4-4d6e-8a0b-1c2d3e4f5a6b";

/** The backoff waits are real seconds in the code, played 10x faster here. */
const SPEEDUP = 10;

interface EdgeSpec {
  d: string;
  label: string;
  lx: number;
  ly: number;
  anchor?: "middle" | "start" | "end";
  /** Arrowheads at both ends, for the read-then-update line. */
  both?: boolean;
  rotate?: number;
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
  /** Waypoints the travelling dot follows, keyed "from->to". */
  elbows: Record<string, [number, number][]>;
  /** Where the "offset saved" note sits while a message waits in the topic. */
  parkedNote: { x: number; y: number; anchor: "middle" | "start" };
  minWidth: string;
}

const WIDE: Layout = {
  w: 700,
  h: 410,
  boxW: 152,
  boxH: 56,
  titleSize: 13.5,
  subSize: 10,
  edgeSize: 10.5,
  nodes: {
    producer: { x: 96, y: 52 },
    postgres: { x: 540, y: 52 },
    topic: { x: 318, y: 196 },
    consumer: { x: 540, y: 196 },
    redis: { x: 540, y: 350 },
    dlq: { x: 318, y: 350 },
  },
  edges: [
    { d: "M 172 52 H 464", label: "[1] INSERT PENDING, commit", lx: 318, ly: 40 },
    { d: "M 96 80 V 196 H 242", label: "[2] publish id", lx: 108, ly: 140, anchor: "start" },
    { d: "M 394 196 H 464", label: "[3] consume", lx: 429, ly: 215 },
    { d: "M 540 168 V 80", label: "SELECT / UPDATE status", lx: 552, ly: 128, anchor: "start", both: true },
    { d: "M 540 224 V 322", label: "INCR retry:<id>", lx: 552, ly: 276, anchor: "start" },
    { d: "M 488 168 C 470 116, 388 116, 370 168", label: "republish after wait", lx: 429, ly: 112 },
    { d: "M 476 224 L 382 322", label: "6th failure", lx: 416, ly: 268, anchor: "end" },
  ],
  elbows: {
    "producer->topic": [[96, 196]],
    "consumer->topic": [
      [496, 150],
      [429, 128],
      [362, 150],
    ],
    "consumer->dlq": [
      [476, 224],
      [382, 322],
    ],
  },
  parkedNote: { x: 318, y: 244, anchor: "middle" },
  minWidth: "560px",
};

const NARROW: Layout = {
  w: 340,
  h: 530,
  boxW: 104,
  boxH: 50,
  titleSize: 11,
  subSize: 7.5,
  edgeSize: 8.5,
  nodes: {
    producer: { x: 90, y: 40 },
    postgres: { x: 266, y: 40 },
    topic: { x: 90, y: 184 },
    consumer: { x: 90, y: 328 },
    redis: { x: 266, y: 328 },
    dlq: { x: 266, y: 472 },
  },
  edges: [
    { d: "M 142 40 H 214", label: "[1] INSERT", lx: 178, ly: 30 },
    { d: "M 90 65 V 159", label: "[2] publish id", lx: 98, ly: 116, anchor: "start" },
    { d: "M 90 209 V 303", label: "[3] consume", lx: 98, ly: 262, anchor: "start" },
    { d: "M 142 316 H 180 V 52 H 214", label: "status", lx: 186, ly: 184, anchor: "start", both: true },
    { d: "M 142 340 H 214", label: "INCR", lx: 178, ly: 356 },
    { d: "M 90 353 V 472 H 214", label: "6th failure", lx: 98, ly: 414, anchor: "start" },
    { d: "M 38 322 C 12 286, 12 226, 38 190", label: "republish", lx: 14, ly: 256, rotate: -90 },
  ],
  elbows: {
    "consumer->postgres": [
      [180, 316],
      [180, 52],
    ],
    "postgres->consumer": [
      [180, 52],
      [180, 316],
    ],
    "consumer->topic": [
      [30, 300],
      [20, 256],
      [30, 212],
    ],
    "consumer->dlq": [[90, 472]],
  },
  parkedNote: { x: 146, y: 230, anchor: "start" },
  minWidth: "0px",
};

/* ---------------------------------------------------------------------------
   Steps. Each one is a hop the dot makes, the boxes it lights, what changes
   in the world (row status, Redis count, consumer up or down), the lines the
   consumer prints, and one sentence saying what just happened.
--------------------------------------------------------------------------- */

interface World {
  row: RowStatus;
  retries: number;
  down: boolean;
  parked: boolean;
  dlq: number;
  /** Seconds of backoff in progress, in real (not sped up) seconds. */
  wait: number | null;
}

interface Step {
  from: NodeId;
  to: NodeId;
  ms: number;
  lit: NodeId[];
  say: string;
  log?: string[];
  set?: Partial<World>;
  /** The dot fades out at the end of this step. */
  vanish?: boolean;
  /** No message is moving during this step, so no dot. */
  hidden?: boolean;
}

const FRESH: World = {
  row: "none",
  retries: 0,
  down: false,
  parked: false,
  dlq: 0,
  wait: null,
};

const READY = "consumer ready, waiting for messages";

function produce(): Step[] {
  return [
    {
      from: "producer",
      to: "postgres",
      ms: 950,
      lit: ["producer", "postgres"],
      set: { row: "PENDING" },
      say: "producer.py inserts a row into notification with status PENDING, and commits.",
    },
    {
      from: "producer",
      to: "topic",
      ms: 950,
      lit: ["producer", "topic"],
      say: "Only after the commit does it publish the notification_id, and nothing else, to the notifications topic.",
    },
  ];
}

function read(scale = 1): Step[] {
  return [
    {
      from: "topic",
      to: "consumer",
      ms: 800 * scale,
      lit: ["topic", "consumer"],
      log: [ID],
      say: "The consumer, in group notification-workers, reads the id and prints it.",
    },
    {
      from: "consumer",
      to: "postgres",
      ms: 800 * scale,
      lit: ["consumer", "postgres"],
      say: "SELECT status FROM notification WHERE notification_id = the id. It goes by the database, not the message.",
    },
  ];
}

/** What happens to a PENDING row, with the send working or failing. */
function deliver(fail: boolean): Step[] {
  if (!fail) {
    return [
      ...read(),
      {
        from: "postgres",
        to: "consumer",
        ms: 850,
        lit: ["consumer"],
        log: ["delivering"],
        say: "PENDING, so it prints delivering and calls send_notification.",
      },
      {
        from: "consumer",
        to: "postgres",
        ms: 950,
        lit: ["consumer", "postgres"],
        log: ["delivering success"],
        set: { row: "SENT" },
        vanish: true,
        say: "The send worked. UPDATE status = 'SENT' and commit, only after the send has gone.",
      },
    ];
  }

  const steps: Step[] = [];
  for (let n = 1; n <= 6; n++) {
    // The middle attempts are the same loop again, so they play a little
    // faster. The waits themselves are always exactly 10x faster.
    const scale = n > 1 && n < 6 ? 0.6 : 1;
    steps.push(...read(scale), {
      from: "postgres",
      to: "consumer",
      ms: 850 * scale,
      lit: ["consumer"],
      log: ["delivering"],
      say:
        n === 1
          ? "PENDING, so it prints delivering and calls send_notification. The send fails."
          : `Attempt ${n}. Still PENDING, and the send fails again.`,
    });
    steps.push({
      from: "consumer",
      to: "redis",
      ms: 750 * scale,
      lit: ["consumer", "redis"],
      set: { retries: n },
      say: `Redis INCR on retry:<id> makes the count ${n}. It lives outside the consumer, so a restart does not reset it.`,
    });

    if (n < 6) {
      const wait = 2 ** (n - 1);
      steps.push(
        {
          from: "consumer",
          to: "consumer",
          ms: (wait * 1000) / SPEEDUP,
          lit: ["consumer"],
          log: ["failed again", String(wait)],
          set: { wait },
          say: `Below 6, so it waits 2^(${n}-1) = ${wait} s before trying again.`,
        },
        {
          from: "consumer",
          to: "topic",
          ms: 850 * scale,
          lit: ["consumer", "topic"],
          set: { wait: null },
          say: "Then it publishes the same id back to the notifications topic.",
        },
      );
    } else {
      steps.push(
        {
          from: "consumer",
          to: "dlq",
          ms: 1000,
          lit: ["consumer", "dlq"],
          log: ["moving to DLQ"],
          set: { dlq: 1 },
          say: "The count reached 6, so instead of retrying it publishes the id to notifications-dlq.",
        },
        {
          from: "consumer",
          to: "postgres",
          ms: 950,
          lit: ["consumer", "postgres"],
          set: { row: "FAILED" },
          vanish: true,
          say: "UPDATE status = 'FAILED' and commit. The row is left for a person to look at.",
        },
      );
    }
  }
  return steps;
}

function scenario(which: ConsumerState, fail: boolean): Step[] {
  switch (which) {
    case "NO_ROW":
      return [
        {
          from: "topic",
          to: "topic",
          ms: 1300,
          lit: ["topic"],
          say: "An id with no row behind it lands on notifications. producer.py never does this, because it commits the row first; the check covers anything else that might.",
        },
        ...read(),
        {
          from: "postgres",
          to: "consumer",
          ms: 950,
          lit: ["consumer"],
          log: [`Notification ID not found ${ID}`],
          vanish: true,
          say: "No row, so it prints Notification ID not found and moves on. Nothing is sent and nothing is written.",
        },
      ];
    case "PENDING":
      return [...produce(), ...deliver(fail)];
    case "SENT":
      return [
        ...produce(),
        {
          from: "topic",
          to: "topic",
          ms: 1500,
          lit: ["topic", "postgres"],
          set: { row: "SENT" },
          say: "Suppose an earlier copy of this id was already delivered, so by now its row says SENT.",
        },
        ...read(),
        {
          from: "postgres",
          to: "consumer",
          ms: 950,
          lit: ["consumer"],
          log: ["already sent, skipping"],
          vanish: true,
          say: "SENT, so it prints already sent, skipping. No second send.",
        },
      ];
    case "FAILED":
      return [
        ...produce(),
        {
          from: "topic",
          to: "topic",
          ms: 1600,
          lit: ["topic", "postgres", "dlq"],
          set: { row: "FAILED", retries: 6, dlq: 1 },
          say: "Suppose this id already failed six times and went to notifications-dlq, so its row says FAILED.",
        },
        ...read(),
        {
          from: "postgres",
          to: "consumer",
          ms: 950,
          lit: ["consumer"],
          log: ["already FAILED, in DLQ, skipping"],
          vanish: true,
          say: "FAILED, so it prints already FAILED, in DLQ, skipping. A dead-lettered message is not retried again.",
        },
      ];
  }
}

function crash(): Step[] {
  return [
    {
      from: "consumer",
      to: "consumer",
      ms: 1300,
      lit: [],
      hidden: true,
      set: { down: true },
      say: "The consumer process dies. Nothing is reading the notifications topic now.",
    },
    ...produce(),
    {
      from: "topic",
      to: "topic",
      ms: 700,
      lit: ["topic"],
      set: { parked: true },
      say: "The id waits in the topic. Kafka keeps the offset saved by group notification-workers, so it is not lost. Press Restart.",
    },
  ];
}

function restart(fail: boolean): Step[] {
  const [first, ...rest] = deliver(fail);
  return [
    {
      from: "consumer",
      to: "consumer",
      ms: 1400,
      lit: ["consumer"],
      hidden: true,
      log: [READY],
      set: { down: false },
      say: "Restarted. It rejoins group notification-workers and carries on from the saved offset, so the waiting id is next.",
    },
    { ...first, set: { ...first.set, parked: false } },
    ...rest,
  ];
}

function duplicate(fail: boolean): Step[] {
  const final: RowStatus = fail ? "FAILED" : "SENT";
  return [
    ...produce(),
    ...deliver(fail),
    {
      from: "topic",
      to: "topic",
      ms: 1400,
      lit: ["topic"],
      say: "Kafka delivers the same id a second time. At-least-once delivery allows exactly that.",
    },
    ...read(),
    {
      from: "postgres",
      to: "consumer",
      ms: 950,
      lit: ["consumer"],
      log: [final === "SENT" ? "already sent, skipping" : "already FAILED, in DLQ, skipping"],
      vanish: true,
      say:
        final === "SENT"
          ? "The row already says SENT, so it prints already sent, skipping. One send, not two."
          : "The row already says FAILED, so it prints already FAILED, in DLQ, skipping.",
    },
  ];
}

/* ---------------------------------------------------------------------------
   Run state. One reducer, so a step's effects (world change, log lines) are
   applied exactly once when it starts, however React schedules renders.
--------------------------------------------------------------------------- */

interface Run {
  scenario: Scenario | null;
  steps: Step[];
  i: number;
  world: World;
  log: string[];
}

type Action =
  | { type: "start"; scenario: Scenario; steps: Step[]; keep?: boolean }
  | { type: "next" };

function enter(run: Run, i: number): Run {
  const step = run.steps[i];
  if (!step) return { ...run, i };
  return {
    ...run,
    i,
    world: { ...run.world, ...step.set },
    log: step.log ? [...run.log, ...step.log].slice(-40) : run.log,
  };
}

function reducer(run: Run, action: Action): Run {
  if (action.type === "start") {
    const base: Run = action.keep
      ? { ...run, scenario: action.scenario, steps: action.steps }
      : {
          scenario: action.scenario,
          steps: action.steps,
          i: 0,
          world: FRESH,
          log: [READY],
        };
    return enter(base, 0);
  }
  return enter(run, run.i + 1);
}

const IDLE: Run = { scenario: null, steps: [], i: 0, world: FRESH, log: [READY] };

/* ---------------------------------------------------------------------------
   Component
--------------------------------------------------------------------------- */

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

const STATES: { state: ConsumerState; label: string }[] = [
  { state: "NO_ROW", label: "No row" },
  { state: "PENDING", label: "PENDING" },
  { state: "SENT", label: "SENT" },
  { state: "FAILED", label: "FAILED" },
];

export default function KafkaDiagram() {
  const reduced = useReducedMotion() ?? false;
  const layout = useLayout();
  const [run, dispatch] = useReducer(reducer, IDLE);
  const [fail, setFail] = useState(false);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const invited = useRef(false);

  const current: Step | undefined = run.steps[run.i];
  const done = run.scenario !== null && run.i >= run.steps.length;
  const last = run.steps[run.steps.length - 1];
  const { world } = run;

  const start = useCallback(
    (scenario: Scenario, steps: Step[], keep = false) =>
      dispatch({ type: "start", scenario, steps, keep }),
    [],
  );

  // Plays the PENDING path once as an invitation the first time it is
  // scrolled to. After that it answers a tap and nothing else.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !invited.current && !reduced) {
          invited.current = true;
          start("PENDING", scenario("PENDING", false));
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, start]);

  // Advances one step at a time, and only while the diagram is on screen.
  // Under reduced motion nothing advances by itself: the Next step button does.
  useEffect(() => {
    if (reduced || !inView || !current) return;
    const t = window.setTimeout(() => dispatch({ type: "next" }), current.ms);
    return () => window.clearTimeout(t);
  }, [reduced, inView, current, run.i]);

  const lit: NodeId[] = current?.lit ?? [];
  const caption = current?.say ?? (done ? last?.say : "") ?? "";
  const showDot = current && !current.hidden;
  const dot = showDot ? path(current, layout) : null;
  const canRestart = world.down && done;

  const activeState: ConsumerState | null =
    run.scenario && run.scenario !== "CRASH" && run.scenario !== "DUP"
      ? run.scenario
      : null;

  return (
    <div ref={rootRef} className="panel overflow-hidden p-4 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-sub font-semibold text-[var(--text)]">
          What the consumer does, and why
        </h3>
        <p className="mono text-meta text-[var(--dim)]" aria-live="off">
          retry:&lt;id&gt; ={" "}
          <span className="text-[var(--text)]">{world.retries}</span>
          {world.wait !== null ? (
            <>
              {" · "}
              waiting <span className="text-[var(--text)]">{world.wait} s</span>{" "}
              <span className="text-[var(--accent)]">(sped up {SPEEDUP}×)</span>
            </>
          ) : null}
        </p>
      </div>

      <p className="mt-2 max-w-[66ch] text-body text-[var(--dim)]">
        Every step and every log line below is what{" "}
        <span className="mono text-[14px]">consumer.py</span> really does. Pick
        the status the consumer finds, or try one of the failures.
      </p>

      {/* Controls. Real buttons, keyboard operable, 44px tall on a phone. */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap" role="group" aria-label="Row status the consumer finds">
          {STATES.map((s) => (
            <Control
              key={s.state}
              active={run.scenario === s.state}
              onClick={() => start(s.state, scenario(s.state, fail))}
            >
              {s.label}
            </Control>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Failures to try">
          <button
            type="button"
            role="switch"
            aria-checked={fail}
            onClick={() => setFail((f) => !f)}
            className={`mono inline-flex min-h-[44px] items-center gap-2.5 rounded-button border px-3.5 py-2 text-[13px] transition-colors duration-[180ms] ${
              fail
                ? "border-[var(--fail)] text-[var(--text)]"
                : "border-[var(--stroke)] bg-[var(--glass)] text-[var(--text)] hover:border-[var(--stroke-bright)]"
            }`}
          >
            Make the send fail
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                fail ? "bg-[var(--fail)] text-[#0B0E14]" : "bg-[var(--glass-strong)] text-[var(--dim)]"
              }`}
            >
              {fail ? "On" : "Off"}
            </span>
          </button>
          <Control
            active={run.scenario === "CRASH"}
            onClick={() =>
              canRestart
                ? start("CRASH", restart(fail), true)
                : start("CRASH", crash())
            }
          >
            {canRestart ? "Restart the consumer" : "Crash the consumer"}
          </Control>
          <Control
            active={run.scenario === "DUP"}
            onClick={() => start("DUP", duplicate(fail))}
          >
            Kafka delivers it twice
          </Control>
        </div>
        {reduced && run.scenario ? (
          <div className="flex items-center gap-4">
            <Control
              active={false}
              disabled={done}
              onClick={() => dispatch({ type: "next" })}
            >
              Next step
            </Control>
            <span className="mono text-meta text-[var(--dim)]">
              Step {Math.min(run.i + 1, run.steps.length)} of {run.steps.length}
            </span>
          </div>
        ) : null}
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
          <title id="kafka-svg-title">Architecture of the notification pipeline</title>
          <desc id="kafka-svg-desc">
            producer.py inserts a PENDING row into PostgreSQL and commits, then
            publishes the id to the Kafka topic notifications. consumer.py, in
            group notification-workers, reads the id and checks the row status.
            No row, SENT or FAILED: it skips. PENDING: it sends, and marks the
            row SENT if the send works. If the send fails it increments a Redis
            counter, waits 1, 2, 4, 8 or 16 seconds and republishes the id; on
            the sixth failure it publishes the id to notifications-dlq and marks
            the row FAILED. The same information is in the table below.
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

          {(["producer", "postgres", "topic", "consumer", "redis", "dlq"] as NodeId[]).map((id) => (
            <Box
              key={id}
              id={id}
              lit={lit.includes(id)}
              world={world}
              layout={layout}
            />
          ))}

          {world.parked ? (
            <text
              x={layout.parkedNote.x}
              y={layout.parkedNote.y}
              textAnchor={layout.parkedNote.anchor}
              className="mono"
              fontSize={layout.edgeSize}
              fill="var(--accent)"
            >
              {layout === NARROW
                ? "waiting · offset saved"
                : "1 waiting · offset saved by group notification-workers"}
            </text>
          ) : null}

          {/* A message parked in the topic while the consumer is down. */}
          {done && world.parked ? (
            <circle
              r={layout === NARROW ? 5.5 : 7}
              cx={layout.nodes.topic.x}
              cy={layout.nodes.topic.y + layout.boxH / 2 - 9}
              fill="var(--accent)"
            />
          ) : null}
          {dot && reduced ? (
            <circle
              r={layout === NARROW ? 5.5 : 7}
              cx={dot.cx[dot.cx.length - 1]}
              cy={dot.cy[dot.cy.length - 1]}
              fill="var(--accent)"
            />
          ) : null}
          {dot && !reduced ? (
            <m.circle
              key={`${run.scenario}-${run.i}`}
              r={layout === NARROW ? 5.5 : 7}
              fill="var(--accent)"
              initial={{ cx: dot.cx[0], cy: dot.cy[0], opacity: 1 }}
              animate={{
                cx: dot.cx,
                cy: dot.cy,
                opacity: current?.vanish ? [1, 1, 0] : 1,
              }}
              transition={{ duration: (current?.ms ?? 800) / 1000, ease: "easeInOut" }}
            />
          ) : null}
        </svg>
      </div>

      <p
        aria-live="polite"
        className="mt-5 min-h-[3.2rem] max-w-[68ch] border-l-2 border-[var(--accent)] pl-4 text-body text-[var(--dim)]"
      >
        {caption || "Pick a status above to run a message through."}
      </p>

      {/* The consumer's own output, line for line. */}
      <div
        role="log"
        aria-live="off"
        aria-label="consumer.py output"
        className="mono mt-4 rounded-button border border-[var(--stroke)] bg-[rgba(0,0,0,0.35)] px-4 py-3 text-[12px] leading-[1.7] text-[var(--dim)]"
      >
        <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--dim)] opacity-70">
          consumer.py output
        </p>
        {run.log.slice(-7).map((line, i, arr) => (
          <p
            key={`${run.log.length - arr.length + i}-${line}`}
            className={`overflow-hidden text-ellipsis whitespace-nowrap ${
              i === arr.length - 1 ? "text-[var(--text)]" : ""
            }`}
          >
            <span aria-hidden="true" className="opacity-50">
              ${" "}
            </span>
            {line}
          </p>
        ))}
      </div>

      <p className="mt-4 max-w-[68ch] text-meta text-[var(--dim)]">
        <span className="text-[var(--text)]">Known gap.</span> If the consumer
        crashes after sending but before marking SENT, the message is redelivered
        and can be sent twice. At-least-once, not exactly-once.
      </p>

      {/* The text equivalent. On a phone each row becomes its own block. */}
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
              const active = activeState === d.state;
              return (
                <tr
                  key={d.state}
                  aria-current={active ? "true" : undefined}
                  className={`border-b border-[var(--stroke)] transition-colors last:border-b-0 max-sm:mb-3 max-sm:block max-sm:rounded-panel max-sm:border max-sm:p-4 ${
                    active ? "bg-[var(--glass-strong)] max-sm:border-[var(--accent)]" : ""
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

function Control({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`mono min-h-[44px] rounded-button border px-3.5 py-2 text-[13px] transition-all duration-[180ms] disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] font-medium text-[#0B0E14]"
          : "border-[var(--stroke)] bg-[var(--glass)] text-[var(--text)] hover:border-[var(--stroke-bright)] hover:bg-[var(--glass-strong)]"
      }`}
    >
      {children}
    </button>
  );
}

function Edge({ spec, size }: { spec: EdgeSpec; size: number }) {
  return (
    <g>
      <path
        d={spec.d}
        fill="none"
        stroke="var(--stroke-bright)"
        strokeWidth="1"
        markerEnd="url(#arrow)"
        markerStart={spec.both ? "url(#arrow)" : undefined}
      />
      <text
        x={spec.lx}
        y={spec.ly}
        textAnchor={spec.anchor ?? "middle"}
        transform={spec.rotate ? `rotate(${spec.rotate} ${spec.lx} ${spec.ly})` : undefined}
        className="mono"
        fontSize={size}
        fill="var(--dim)"
      >
        {spec.label}
      </text>
    </g>
  );
}

/** The title and the live second line for each box. Text, not just colour. */
function labelFor(id: NodeId, world: World): { title: string; sub: string } {
  switch (id) {
    case "producer":
      return { title: "producer.py", sub: "" };
    case "postgres":
      return {
        title: "PostgreSQL",
        sub: world.row === "none" ? "table notification" : `status: ${world.row}`,
      };
    case "topic":
      return { title: "Kafka topic", sub: "notifications" };
    case "consumer":
      return {
        title: "consumer.py",
        sub: world.down ? "CRASHED" : "notification-workers",
      };
    case "redis":
      return {
        title: "Redis",
        sub: world.retries > 0 ? `retry:<id> = ${world.retries}` : "retry counters",
      };
    case "dlq":
      return {
        title: "Kafka topic",
        sub: world.dlq > 0 ? "notifications-dlq · 1" : "notifications-dlq",
      };
  }
}

function Box({
  id,
  lit,
  world,
  layout,
}: {
  id: NodeId;
  lit: boolean;
  world: World;
  layout: Layout;
}) {
  const n = layout.nodes[id];
  const { title, sub } = labelFor(id, world);
  const crashed = id === "consumer" && world.down;

  return (
    <g opacity={crashed ? 0.55 : 1}>
      <rect
        x={n.x - layout.boxW / 2}
        y={n.y - layout.boxH / 2}
        width={layout.boxW}
        height={layout.boxH}
        rx="10"
        fill={lit ? "rgba(240,165,56,0.13)" : "rgba(255,255,255,0.045)"}
        stroke={crashed ? "var(--fail)" : lit ? "var(--accent)" : "var(--stroke)"}
        strokeDasharray={crashed ? "4 4" : undefined}
        strokeWidth="1"
        style={{ transition: "fill 180ms ease, stroke 180ms ease" }}
      />
      <text
        x={n.x}
        y={sub ? n.y - 3 : n.y + layout.titleSize / 3}
        textAnchor="middle"
        fontSize={layout.titleSize}
        fontWeight="500"
        fill="var(--text)"
      >
        {title}
      </text>
      {sub ? (
        <text
          x={n.x}
          y={n.y + layout.subSize + 6}
          textAnchor="middle"
          className="mono"
          fontSize={layout.subSize}
          fill={crashed ? "var(--fail)" : "var(--dim)"}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

/** Keyframes for one step, following any elbows the active layout defines. */
function path(step: Step, layout: Layout): { cx: number[]; cy: number[] } {
  const from = layout.nodes[step.from];
  const to = layout.nodes[step.to];
  const mid = step.from === step.to ? [] : (layout.elbows[`${step.from}->${step.to}`] ?? []);
  return {
    cx: [from.x, ...mid.map((p) => p[0]), to.x],
    cy: [from.y, ...mid.map((p) => p[1]), to.y],
  };
}

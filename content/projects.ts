/**
 * Project content. Same rule as profile.ts: every number here was measured, and
 * nothing gets rounded, estimated or "improved" for effect.
 *
 * The restaurant figures were measured on 30 and 31 August 2026.
 */

export interface Metric {
  label: string;
  value: string;
  /** At most one metric per ledger is highlighted. Part 6.4. */
  tone?: "ok" | "fail";
}

export interface Project {
  slug: string;
  title: string;
  /** Rendered in mono under the title. */
  meta: string;
  status: string;
  lead?: boolean;
  stack: string[];
  metrics: Metric[];
  /** Two or three sentences on the home page panel. */
  summary: string[];
  demoUrl?: string;
  repoUrl?: string;
  repoLabel?: string;
}

export const PROJECTS: Project[] = [
  {
    slug: "restaurant",
    lead: true,
    title: "Restaurant ordering and till system",
    meta: "Commercial · sole developer · Co. Kildare",
    status: "Running in production",
    stack: ["TypeScript 5.9", "React 19.2", "Expo SDK 54", "Postgres", "Supabase RLS"],
    metrics: [
      { label: "commits in seven weeks", value: "154" },
      { label: "lines of TypeScript", value: "15,109" },
      { label: "generated test cases per run", value: "560,015" },
      { label: "times the house was undercharged", value: "0", tone: "ok" },
    ],
    summary: [
      "A till that takes real money in a restaurant in Co. Kildare, every day. One Expo codebase drives four surfaces against one Postgres database, and I am the only person who works on it.",
      "Then I built the thing that proves it is right. 43 properties, 560,015 generated orders per run, about a second, no test framework.",
    ],
    demoUrl: "https://order-dependent-pricing.surge.sh",
    repoUrl: "https://github.com/Harshal-Abdulla/order-dependent-pricing",
    repoLabel: "Demo source",
  },
  {
    slug: "notifications",
    title: "Fault-tolerant notification system",
    meta: "Personal · distributed systems",
    // Verified against the code on 1 Sept 2026. What is built: write-before-
    // publish, and the consumer's no-row / PENDING / SENT branches. What is
    // designed but NOT yet written: the FAILED retry path, Redis attempt
    // counters, the dead-letter queue and the recovery sweep. Say so plainly;
    // do not describe the unbuilt half as if it exists.
    status: "Delivery path built, retry path designed",
    stack: ["Python", "Apache Kafka", "PostgreSQL", "Redis", "Docker Compose"],
    metrics: [
      { label: "what Kafka gives you", value: "At-least-once" },
      { label: "source of truth", value: "Postgres" },
      { label: "idempotency guard", value: "SELECT before UPDATE" },
    ],
    summary: [
      "Kafka promises at-least-once delivery, which is a polite way of saying the same message will arrive twice. That duplicate is the actual design problem, and the naive send-a-notification function has no answer to it.",
      "The producer writes a PENDING row to Postgres before it publishes. The consumer reads the row's status before it acts, so a duplicate is a no-op rather than a second send. The failure path is designed and written up but not built yet.",
    ],
    repoUrl: "https://github.com/Harshal-Abdulla/Kafka-Notification-System",
    repoLabel: "Repository",
  },
  {
    slug: "sketchpad",
    title: "Sketchpad Retro",
    meta: "Individual MSc project · 2025",
    status: "Complete",
    stack: ["Next.js 14", "React", "TypeScript", "SVG"],
    metrics: [],
    summary: [
      "A browser rebuild of Ivan Sutherland's 1963 Sketchpad. The constraint solver, the geometry engine and the undo stack are all written from scratch, and the whole interface is drawn and edited in SVG.",
      "Mostly a state problem rather than a styling one: keeping React coherent while a user draws, constrains and edits shapes that depend on each other.",
    ],
    demoUrl: "https://harshal-abdulla.github.io/Sketchpad-Retro-Computing/simulator/",
    repoUrl: "https://github.com/Harshal-Abdulla/Sketchpad-Retro-Computing",
    repoLabel: "Repository",
  },
];

export const projectBySlug = (slug: string): Project => {
  const found = PROJECTS.find((p) => p.slug === slug);
  if (!found) throw new Error(`No project with slug "${slug}"`);
  return found;
};

/* -------------------------------------------------------------------------
   Restaurant case study
------------------------------------------------------------------------- */

export const RESTAURANT_SURFACES = [
  {
    surface: "Kiosk",
    who: "Customers, unattended",
    does: "Self-service touchscreen at the counter. Full menu, dish options, portion-level sides, meal-deal detection, cart, checkout, order confirmation.",
  },
  {
    surface: "Kitchen till",
    who: "Staff",
    does: "Live queue of incoming orders, accept and reject, docket printing, order amendment, off-menu items with live suggestions from both menus.",
  },
  {
    surface: "Table service",
    who: "Waiting staff",
    does: "Dine-in ordering across multiple rounds, per-portion side selection, running tab, supplement entitlements carried across rounds, bill close-out.",
  },
  {
    surface: "Admin",
    who: "Owner",
    does: "Sales and reports, order history and voiding, menu and pricing edits, allergen declarations, best-seller breakdowns.",
  },
];

export const RESTAURANT_FIGURES: Metric[] = [
  { label: "commits, 13 July to 30 August 2026", value: "154" },
  { label: "lines of TypeScript and TSX", value: "15,109" },
  { label: "SQL migrations, 12,469 lines", value: "94" },
  { label: "Postgres functions behind RLS", value: "~70" },
  { label: "properties in the test suite", value: "43" },
  { label: "generated cases per run, about a second", value: "560,015" },
  { label: "orders taken, August 2026", value: "251" },
  { label: "dishes rung in, August 2026", value: "1,474" },
];

export const RESTAURANT_DECISIONS = [
  {
    n: "01",
    title: "Business rules live in the database, not the client",
    body: "Pricing and entitlement logic is plpgsql behind security definer. All four surfaces ask the same question and get the same answer, and no client can talk its way past the till.",
  },
  {
    n: "02",
    title: "Money is integer euro cents",
    body: "There is no floating point anywhere in pricing. Order lines are immutable snapshots and corrections are soft deletes, so history is never rewritten underneath a report that has already been read.",
  },
  {
    n: "03",
    title: "There is no application server",
    body: "Static hosting plus row level security removes a whole tier that would otherwise need deploying, patching and monitoring by one person who also runs a kitchen. The client talks to Postgres through PostgREST, and RLS is the boundary.",
  },
  {
    n: "04",
    title: "The test suite has no dependencies, on purpose",
    body: "It has to still run in a year, on a laptop where nothing is installed and npm may not reach the network. No Jest, no fast-check, no build step.",
  },
];

/** Measured over 20,000 baskets, each rung in twice. */
export const PRICING_ROWS: Metric[] = [
  { label: "Same food, different tap order, different bill", value: "41.0%" },
  { label: "Charged above the cheapest possible arrangement", value: "42.1%" },
  { label: "Average gap when it happens", value: "€0.43" },
  { label: "Worst single basket", value: "€1.95" },
  { label: "Times the house was undercharged", value: "0", tone: "ok" },
];

export const RESTAURANT_GAPS = [
  "Allergen coverage is incomplete. 80 of 201 dishes have declarations recorded. It is the one area here with legal weight and it is tracked as outstanding.",
  "There are no automated backups. I know, and it is the next infrastructure job.",
  "One deal path is not fuzzed. The Dinner for Two supplement path has never been put through the property suite.",
  "The pricing refinement is deliberately unfixed. It is measured, documented, guarded by a test, and left alone on the owner's decision.",
];

/* -------------------------------------------------------------------------
   Notification system case study
------------------------------------------------------------------------- */

export type ConsumerState = "NO_ROW" | "PENDING" | "SENT" | "FAILED";

export const CONSUMER_DECISIONS: {
  state: ConsumerState;
  label: string;
  action: string;
  why: string;
  tone: "dim" | "ok" | "fail";
}[] = [
  {
    state: "NO_ROW",
    label: "No row",
    action: "Silent drop",
    why: "Every legitimate message is guaranteed a PENDING row, so a message without one is not real. Safe by construction.",
    tone: "dim",
  },
  {
    state: "PENDING",
    label: "PENDING",
    action: "Deliver, then flip to SENT only after delivery is confirmed",
    why: "Flipping the row before delivery would mark an unsent message as sent, which is the one lie the system must never tell.",
    tone: "ok",
  },
  {
    state: "SENT",
    label: "SENT",
    action: "Skip",
    why: "The idempotency guard. This is the duplicate Kafka warned us about, and reprocessing it is a no-op rather than a second send.",
    tone: "dim",
  },
  {
    state: "FAILED",
    label: "FAILED",
    action: "Retry with exponential backoff, then dead-letter after N attempts (designed, not built yet)",
    why: "Distinguishes not tried yet from tried and failed. Collapsing the two loses the information the retry logic runs on.",
    tone: "fail",
  },
];

export const NOTIFICATION_PROBLEMS = [
  {
    n: "01",
    title: "The ordering problem",
    body: "Postgres has to be written before Kafka, not after. If the process dies between the two, the PENDING row is still there and a recovery sweep finds it. Reversed, the crash leaves a message in flight with no durable record that it ever existed.",
  },
  {
    n: "02",
    title: "The duplicate problem",
    body: "Kafka delivers at least once, so the same message ID will arrive twice. The consumer reads the row's status before it acts, which makes it idempotent by design rather than idempotent by luck.",
  },
  {
    n: "03",
    title: "The retry counter problem",
    body: "The count cannot live in the consumer's memory. Process memory resets to zero on restart, so a poison message would loop forever and never reach the dead-letter queue. Run two consumers and each keeps its own separate count for the same message, which breaks horizontal scaling outright.",
  },
];

export const NOTIFICATION_NEXT = [
  "Consumer group scaling, and a partition-key strategy for ordering guarantees.",
  "Metrics on delivery latency and dead-letter queue volume.",
  "The failure path itself: the FAILED branch, Redis attempt counters, exponential backoff and the dead-letter queue. Designed in detail, not written yet.",
  "A provider abstraction so email, SMS and push share one delivery contract.",
];

/* -------------------------------------------------------------------------
   Also built
------------------------------------------------------------------------- */

export const ALSO_BUILT: {
  title: string;
  meta: string;
  lines: string[];
  demoUrl?: string;
  repoUrl?: string;
}[] = [
  {
    title: "Twix",
    // Date settled by the git history, 1 Sept 2026: every commit is December
    // 2024. Harshal remembered 2024 and the brief said 2025. He was right.
    meta: "Group MSc project · December 2024 · team of five",
    lines: [
      // Corrected 1 Sept 2026 after reading the actual code. It was described
      // as real-time chat over WebSockets. It is neither: there is no socket
      // dependency and no socket code anywhere, the feed polls every three
      // seconds, and the modules are users, tweets and followers rather than
      // messages. Do not reintroduce the WebSocket claim.
      "A Twitter-style microblog. You search for someone, follow them, post tweets up to 250 characters, and read a feed of the people you follow.",
      "Java and Spring Boot over PostgreSQL, with a React, TypeScript and Vite frontend using Axios and Bootstrap. Followers get notified through an observer-pattern implementation in the backend, and the feed polls the API every three seconds rather than holding a connection open.",
      // "Led" confirmed by Harshal, 31 Aug 2026: he led Twix. He did NOT lead
      // SyncUp, where more experienced people were on the team, and nothing
      // below claims he did. Keep it that way.
      "I led the team of five, and my own share of the work was the interface and the testing. I based the layout on Twitter, so all five of us had one reference to build against instead of designing the thing from scratch and arguing about it.",
    ],
    // Live 2 Sept 2026. Two containers in one Vercel project: nginx serving the
    // built frontend, Spring Boot behind /api. Cold start is a few seconds
    // because the backend is a JVM that scales to zero; warm it answers in
    // about 300ms.
    demoUrl: "https://frontend-nu-nine-pnw4fl7dvt.vercel.app",
    repoUrl: "https://github.com/Harshal-Abdulla/twix",
  },
  {
    // The app calls itself Solas, which is what it is named in strings.xml and
    // on screen. The repository README still says "Local AI Chat".
    title: "Solas",
    meta: "Personal \u00b7 Android \u00b7 in progress",
    lines: [
      "An Android app that runs Google's Gemma 2B entirely on the phone. No internet once the model is downloaded, no subscription, and nothing leaves the device.",
      "Kotlin over MediaPipe Tasks GenAI. Tokens stream back as they are generated, and the conversation history is rebuilt into a Gemma-format prompt on every turn, which is what gives it memory of what you said earlier.",
      "An early build rather than a finished app. It runs and it answers, but it is rough, unsigned, and not packaged for anyone to install yet. The code is there to read.",
    ],
    // Deliberately no download. It is not a release build and should not be
    // offered as one; the repository link is the honest thing to point at.
    repoUrl: "https://github.com/Harshal-Abdulla/local-ai-android",
  },
  {
    title: "SyncUp",
    meta: "Group MSc project · 2025",
    lines: [
      // Corrected 1 Sept 2026 after reading the code, same as Twix. It was
      // called a kanban tool with To Do / In Progress / Done columns. Task.js
      // has a boolean completed field, not a three-state one, and the UI is a
      // filterable list with a checkbox, not a drag-and-drop board.
      "A task tool built with Node.js, Express, MongoDB and React. Tasks belong to groups and can be private, shared with a group, or public, and each can be tagged and marked complete.",
      "Full CRUD over a REST API, with password hashing using bcryptjs.",
      // Claims nothing else. No Docker, no role-based access control, no CI/CD,
      // no FastAPI. JWT is fine: the auth routes issue and verify tokens.
    ],
    demoUrl: "https://sync-up-rosy-psi.vercel.app",
    repoUrl: "https://github.com/Harshal-Abdulla/SyncUp",
  },
];

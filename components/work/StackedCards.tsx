"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";

const DECK = [
  { y: -10, scale: 0.972, opacity: 0.5 },
  { y: -20, scale: 0.948, opacity: 0.32 },
  { y: -30, scale: 0.924, opacity: 0.18 },
];

/**
 * Animation B. The signature scroll moment, taken from the reference.
 *
 * Three card outlines are fanned above the real card, offset by 10, 20 and 30px
 * and scaled down slightly, each one more transparent than the last. As the
 * section scrolls into place they slide down and collapse into the card. It
 * tells you there is a set before you see the set.
 *
 * Driven by scroll progress through useScroll and useTransform, never a timer,
 * so it tracks the wheel rather than racing it. Nothing here touches scroll
 * position: this reads scroll, it does not drive it.
 *
 * Under reduced motion the outlines are simply not rendered.
 */
export default function StackedCards({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 55%"],
  });

  if (reduced) return <>{children}</>;

  return (
    <div ref={ref} className="relative">
      <Deck progress={scrollYProgress} />
      <div className="relative">{children}</div>
    </div>
  );
}

function Deck({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-full" aria-hidden="true">
      {DECK.map((card, i) => (
        <DeckCard key={i} progress={progress} {...card} />
      ))}
    </div>
  );
}

function DeckCard({
  progress,
  y,
  scale,
  opacity,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  y: number;
  scale: number;
  opacity: number;
}) {
  // At progress 0 the outline is fanned out above the card. At 1 it has
  // collapsed into it and faded away.
  const translateY = useTransform(progress, [0, 1], [y, 0]);
  const s = useTransform(progress, [0, 1], [scale, 1]);
  const o = useTransform(progress, [0, 0.85, 1], [opacity, opacity * 0.25, 0]);

  return (
    <m.div
      style={{ y: translateY, scale: s, opacity: o }}
      className="absolute inset-x-0 top-0 h-[220px] rounded-panel border border-[var(--stroke-bright)]"
    />
  );
}

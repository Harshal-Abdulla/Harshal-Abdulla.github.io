"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

/**
 * Animation A. Elements rise 14px and fade in as they enter the viewport.
 * Fires once and never again.
 *
 * Two things make this safe rather than clever:
 *
 *  - Under `prefers-reduced-motion` it renders in its FINAL state, not a
 *    degraded one. CSS in globals.css backstops this for the moment before
 *    hydration.
 *  - With JavaScript off, the prerendered HTML would otherwise carry
 *    `opacity: 0` forever. The `data-reveal` attribute lets the <noscript>
 *    block in app/layout.tsx force everything visible.
 */
export default function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Seconds. Siblings are staggered 70ms apart by <Stagger>. */
  delay?: number;
  className?: string;
  id?: string;
}) {
  const reduced = useReducedMotion();
  const Tag = m[as as keyof typeof m] as ElementType;

  if (reduced) {
    const Static = as;
    return (
      <Static className={className} id={id}>
        {children}
      </Static>
    );
  }

  return (
    <Tag
      id={id}
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.48,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </Tag>
  );
}

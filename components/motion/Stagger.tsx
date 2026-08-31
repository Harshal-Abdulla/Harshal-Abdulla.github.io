"use client";

import { Children, isValidElement } from "react";
import type { ReactNode } from "react";
import Reveal from "./Reveal";

/**
 * Wraps each child in a Reveal, offset 70ms from the one before it.
 * Capped so a long list never leaves the last item waiting on a queue.
 */
export default function Stagger({
  children,
  className,
  step = 0.07,
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  max?: number;
}) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={Math.min(i, max) * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

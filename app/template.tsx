"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Animation G. A 220ms cross-fade between routes and nothing more elaborate.
 * A slow page transition on a static site is a self-inflicted performance
 * problem, so this is deliberately the cheapest thing that reads as intentional.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}

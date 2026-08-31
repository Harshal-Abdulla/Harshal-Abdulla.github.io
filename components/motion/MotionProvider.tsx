"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Framer Motion earns its place here because the site is animation-heavy, but
 * the full package does not. LazyMotion with the domAnimation feature bundle
 * loads roughly a third of it, and every component below uses `m.*` rather than
 * `motion.*` so the rest is never pulled in.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

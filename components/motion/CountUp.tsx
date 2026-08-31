"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animation E. Figures count from zero to their value once, the first time they
 * are scrolled into view. Under 700ms, ease-out, never repeats.
 *
 * It parses the string rather than taking a number, so "15,109", "€0.43",
 * "41.0%" and "~70" all animate while keeping their prefix, suffix, decimals
 * and thousands separators. A value with no digits, like "At-least-once", is
 * printed as-is.
 *
 * Used on one section per page. Part 5.6.
 */

interface Parsed {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  grouped: boolean;
}

function parse(value: string): Parsed | null {
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const target = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;
  return {
    prefix: m[1],
    suffix: m[3],
    target,
    decimals: (m[2].split(".")[1] ?? "").length,
    grouped: m[2].includes(","),
  };
}

function render(p: Parsed, n: number): string {
  const fixed = n.toFixed(p.decimals);
  const body = p.grouped
    ? Number(fixed).toLocaleString("en-IE", {
        minimumFractionDigits: p.decimals,
        maximumFractionDigits: p.decimals,
      })
    : fixed;
  return `${p.prefix}${body}${p.suffix}`;
}

export default function CountUp({ value }: { value: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  // Parsing is cheap and deterministic, but it must not land in an effect
  // dependency array: a fresh object every render would restart the effect and
  // reset the figure to zero after it had already counted up.
  const parsed = parse(value);

  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced) return;

    const node = ref.current;
    const p = parse(value);
    if (!node || !p) return;

    let frame = 0;
    let played = false;

    setDisplay(render(p, 0));

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || played) return;
        played = true;
        observer.disconnect();

        const duration = 680;
        const start = performance.now();

        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          if (t < 1) {
            setDisplay(render(p, p.target * eased));
            frame = requestAnimationFrame(tick);
          } else {
            // Land on the exact string that was passed in, never a re-format.
            setDisplay(value);
          }
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // `value` is the only real input. Everything else is derived from it.
  }, [reduced, value]);

  // Reduced motion, or a value with no number in it: the final value, now.
  if (reduced || !parsed) return <span>{value}</span>;

  return (
    <span ref={ref} suppressHydrationWarning>
      {display}
    </span>
  );
}

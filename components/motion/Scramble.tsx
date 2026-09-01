"use client";

import { useEffect, useRef, useState } from "react";

/*
  Scramble
  --------
  Monospace labels resolve out of noise: random glyphs settle into the real
  characters from left to right.

  This is only safe on monospace text. Every glyph occupies one cell, so
  substituting characters cannot change the width of the line and nothing after
  it can move. On the proportional headline the same effect would make the line
  shiver, which is why that uses Decode instead.

  Rules it keeps:

    - The server renders the real string, and that string stays in state until
      the effect replaces it. JS off, or the effect never runs, and the label
      still reads correctly.
    - prefers-reduced-motion skips the whole thing. Not a shortened version, not
      a fade instead: the effect returns before it starts.
    - It runs once, when the label first scrolls into view, and never again.
      A label that re-scrambles every time it re-enters the viewport is a
      distraction rather than a detail.
*/

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}=+*#%$&";
const REVEAL_PER_CHAR_MS = 26;
const FRAME_MS = 42;

export function Scramble({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let settle = 0;
    let start = 0;
    const chars = [...text];

    const run = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      // How many characters have settled. The rest are still noise.
      const settled = Math.floor(elapsed / REVEAL_PER_CHAR_MS);
      // Which noise frame we are on, so the unsettled glyphs change at a
      // readable rate rather than every single frame.
      const frame = Math.floor(elapsed / FRAME_MS);

      setDisplay(
        chars
          .map((char, i) => {
            if (i < settled || char === " ") return char;
            // Seeded off the index and frame so it looks random but does not
            // need any state carried between frames.
            const pick = (i * 31 + frame * 17 + i * frame) % GLYPHS.length;
            return GLYPHS[pick];
          })
          .join(""),
      );

      if (settled >= chars.length) {
        setDisplay(text);
        return;
      }
      raf = requestAnimationFrame(run);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          observer.disconnect();
          raf = requestAnimationFrame(run);

          /*
            Safety net. requestAnimationFrame stops firing when the tab is
            hidden, so a label scrambled at the moment someone switches away
            would sit there as noise until they came back. A timer is throttled
            in a background tab but it still fires, so this guarantees the label
            always ends on the real string no matter what happened to the
            frame loop.
          */
          settle = window.setTimeout(
            () => {
              cancelAnimationFrame(raf);
              setDisplay(text);
            },
            chars.length * REVEAL_PER_CHAR_MS + 600,
          );
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      {/* The accessible name never changes, whatever the visible glyphs are
          doing. A screen reader reads the label, not the noise. */}
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

"use client";

import { Fragment } from "react";

/*
  Decode
  ------
  The headline resolves character by character in a left-to-right wave: each
  glyph rises a few pixels, sharpens out of a blur, and brightens into place.

  Why not scramble the letters, the way the reference does? Because the headline
  is set in a proportional face. Swapping W for i mid-animation changes the width
  of the line, so every following character shifts, and the whole headline
  shivers for the length of the animation. Scramble belongs on the monospace
  labels, where every glyph is the same width and nothing can move. See
  Scramble.tsx.

  Three properties this has to keep:

    - The real text is in the DOM from the server. Not built by script, not
      assembled from a data attribute. View source and the headline is there.
    - Screen readers get one clean string. The per-character spans are hidden
      from the accessibility tree and the whole run carries an aria-label, so
      nobody hears the sentence spelled out one letter at a time.
    - It is CSS, not JavaScript. No rAF loop, no state per character, and it
      still animates with JS disabled. A hundred-odd Framer nodes for one
      headline would cost far more than this is worth.
*/

/*
  The stagger is derived, not fixed. A fixed 26ms per character reads well on a
  short line and terribly on a long one: this headline is 68 characters, which
  at 26ms would leave the last word still resolving 2.7 seconds in, with the
  headline partly invisible for all of it. That is also the LCP element, so a
  slow tail is a measurable performance cost and not only a taste one.

  So the last character is guaranteed to start by START_BUDGET_MS, and the
  per-character step shrinks to fit whatever the text turns out to be. Short
  labels still get the full 26ms and stay crisp.
*/
const MAX_CHAR_STAGGER_MS = 26;
const START_BUDGET_MS = 620;

export function Decode({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  const count = [...text.replace(/ /g, "")].length;
  const step = Math.min(MAX_CHAR_STAGGER_MS, START_BUDGET_MS / Math.max(count, 1));
  let index = 0;

  return (
    <span className={className} aria-label={text}>
      {words.map((word, w) => {
        const chars = [...word];
        return (
          <Fragment key={w}>
            <span className="decode__word" aria-hidden="true">
              {chars.map((char, c) => {
                const ms = Math.round(delay + index * step);
                index += 1;
                return (
                  <span
                    className="decode__char"
                    style={{ animationDelay: `${ms}ms` }}
                    key={c}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
            {/* The space is a sibling of the word, not a child of it. Inside an
                inline-block, trailing whitespace is trimmed by the normal
                white-space rules and every word runs into the next one. */}
            {w < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </span>
  );
}

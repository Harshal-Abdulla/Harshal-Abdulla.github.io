"use client";

import { useEffect, useState } from "react";
import CountUp from "@/components/motion/CountUp";
import { daysSince } from "@/lib/daysSince";

/**
 * A day count that stays current on a static site. The HTML carries the count
 * from the day the site was built; the browser replaces it with today's count,
 * and checks again every ten minutes so a tab left open overnight ticks over.
 *
 * Starts from the built value so the first client render matches the server
 * HTML exactly, which keeps React's hydration quiet.
 */
export default function LiveDays({
  since,
  fallback,
  countUp = false,
}: {
  since: string;
  fallback: string;
  countUp?: boolean;
}) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const update = () => setValue(String(daysSince(since)));
    update();
    const t = window.setInterval(update, 10 * 60 * 1000);
    return () => window.clearInterval(t);
  }, [since]);

  return countUp ? <CountUp value={value} /> : <>{value}</>;
}

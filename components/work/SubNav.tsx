"use client";

import { useEffect, useState } from "react";

export interface SubNavItem {
  id: string;
  label: string;
}

/**
 * Sticky table of contents for a case study. Desktop only: these pages are long
 * enough on a wide screen to be worth navigating, and on a phone it would just
 * be chrome between the reader and the text.
 *
 * Section tracking uses IntersectionObserver rather than a scroll handler, so
 * nothing measures layout while the page is moving.
 */
export default function SubNav({ items }: { items: SubNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A band across the upper middle of the viewport, so the highlighted
      // entry is the one being read rather than the one just off the top.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto lg:block"
    >
      <p className="mono mb-4 text-meta text-[var(--dim)]">On this page</p>
      <ul className="space-y-1 border-l border-[var(--stroke)]">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`-ml-px block border-l py-1.5 pl-4 text-[13.5px] transition-colors ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--text)]"
                    : "border-transparent text-[var(--dim)] hover:border-[var(--stroke-bright)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

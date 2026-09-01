import type { ReactNode } from "react";

/**
 * Small technology tags, used only INSIDE a project card where they are
 * metadata about that project. There is no standalone skills section on this
 * site, because a pill saying "PostgreSQL" proves nothing on its own.
 */
export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mono inline-flex items-center border border-[var(--stroke)] px-2.5 py-1.5 text-[11.5px] leading-none tracking-[0.04em] text-[var(--dim)]">
      {children}
    </span>
  );
}

export function TagRow({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
      {items.map((t) => (
        <li key={t}>
          <Tag>{t}</Tag>
        </li>
      ))}
    </ul>
  );
}

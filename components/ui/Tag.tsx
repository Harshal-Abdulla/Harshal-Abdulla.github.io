import type { ReactNode } from "react";

/**
 * Small technology tags, used only INSIDE a project card where they are
 * metadata about that project. There is no standalone skills section on this
 * site, because a pill saying "PostgreSQL" proves nothing on its own.
 */
export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mono inline-flex items-center rounded-tag border border-[var(--stroke)] bg-[var(--glass)] px-2 py-1 text-[11.5px] leading-none text-[var(--dim)]">
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

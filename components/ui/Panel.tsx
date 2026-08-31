import type { ElementType, ReactNode } from "react";

/**
 * The glass surface. Part 5.5. The visual definition lives in globals.css as
 * `.panel` so there is one implementation of it, not fifteen Tailwind copies.
 *
 * Not everything is a panel. Panels are for projects and genuinely grouped
 * objects. Prose is never wrapped in one.
 */
export default function Panel({
  children,
  as: Tag = "div",
  hover = false,
  className = "",
  id,
}: {
  children: ReactNode;
  as?: ElementType;
  hover?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={`panel ${hover ? "panel--hover" : ""} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "glass";

const base =
  "inline-flex items-center justify-center gap-2 rounded-button px-5 py-3 " +
  "text-[15px] font-medium leading-none transition-all duration-[180ms] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 " +
  "focus-visible:outline-[var(--accent)]";

const variants: Record<Variant, string> = {
  // The single loud element on the page. Solid and warm, never a gradient.
  primary:
    "bg-[var(--accent)] text-[#0B0E14] font-semibold hover:bg-[var(--accent-hover)] " +
    "hover:-translate-y-[2px] focus-visible:outline-offset-[3px]",
  glass:
    "bg-[var(--glass)] text-[var(--text)] border border-[var(--stroke)] " +
    "hover:bg-[var(--glass-strong)] hover:border-[var(--stroke-bright)] hover:-translate-y-[2px]",
};

export default function Button({
  href,
  children,
  variant = "primary",
  download = false,
  external = false,
  className = "",
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  download?: boolean;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  // A download or an off-site link is a plain anchor. next/link is for routes.
  if (download || external || href.startsWith("#") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        {...(download ? { download: "" } : {})}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

import type { Config } from "tailwindcss";

/**
 * Colours are declared once as CSS custom properties in app/globals.css and
 * referenced here, so there is exactly one place to change a token.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        raised: "var(--bg-raised)",
        glass: "var(--glass)",
        "glass-strong": "var(--glass-strong)",
        stroke: "var(--stroke)",
        "stroke-bright": "var(--stroke-bright)",
        text: "var(--text)",
        dim: "var(--dim)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        ok: "var(--ok)",
        fail: "var(--fail)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Part 5.4. Fluid where the brief specifies a clamp.
        hero: ["clamp(38px, 5.6vw, 62px)", { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        title: ["clamp(32px, 4vw, 46px)", { lineHeight: "1.12", letterSpacing: "-0.03em" }],
        section: ["27px", { lineHeight: "1.2", letterSpacing: "-0.022em" }],
        sub: ["19px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        body: ["16px", { lineHeight: "1.6" }],
        "body-lg": ["19px", { lineHeight: "1.6" }],
        meta: ["12.5px", { lineHeight: "1.5" }],
      },
      borderRadius: {
        panel: "2px",
        button: "2px",
        tag: "2px",
      },
      maxWidth: {
        // Part 5.4: body copy never exceeds 75 characters per line.
        prose: "68ch",
        shell: "1120px",
      },
      transitionTimingFunction: {
        reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

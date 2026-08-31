import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { PROFILE, SITE_URL } from "@/content/profile";
import MotionProvider from "@/components/motion/MotionProvider";
import AmbientField from "@/components/layout/AmbientField";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import SkipLink from "@/components/layout/SkipLink";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Harshal Abdulla, software engineer",
    template: "%s — Harshal Abdulla",
  },
  description:
    "I build systems that are not allowed to get money or messages wrong. A commercial restaurant till, and a notification pipeline that will not lose or duplicate a message. Associate software engineer, Ireland.",
  authors: [{ name: PROFILE.name, url: SITE_URL }],
  openGraph: {
    type: "website",
    siteName: PROFILE.name,
    locale: "en_IE",
    url: SITE_URL,
    title: "Harshal Abdulla, software engineer",
    description:
      "A commercial restaurant till, and a notification pipeline that will not lose or duplicate a message. Associate software engineer, Ireland.",
    // A committed file, like every other image here. See tools/README.md to
    // regenerate it.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Harshal Abdulla. I build systems that are not allowed to get money or messages wrong.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  themeColor: "#0B0E14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IE">
      <head>
        {/* Self-hosted, Latin subset, no CDN. Preloaded because both are used
            above the fold and a swap on the hero is the most visible one. */}
        <link
          rel="preload"
          href="/fonts/inter-latin-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/jetbrains-mono-latin-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Everything on this site is readable with JavaScript switched off.
            The reveal animation would otherwise leave prerendered content at
            opacity 0 forever, so with no JS it is forced to its final state. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <MotionProvider>
          <SkipLink />
          <AmbientField />
          <Nav />
          <main id="main" className="relative">
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}

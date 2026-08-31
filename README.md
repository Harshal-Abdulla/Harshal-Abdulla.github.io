# Harshal Abdulla, portfolio

The site at **https://harshal-abdulla.github.io**.

This file assumes you have forgotten everything about this project, because in a
year you will have. Nothing here needs prior context.

---

## The one rule

**There is no server.** No database, no API route, no environment variable, no API
key, no third-party service. `npm run build` writes a folder of plain files and
GitHub serves them. Every byte of this site is in this repository.

That is deliberate. You are not going to maintain this. It has to still work,
untouched, when someone Googles you before an interview two years from now. Every
dynamic feature you add is a future outage, so if you find yourself writing a
`fetch`, stop.

## Running it locally

```bash
npm ci        # not npm install: the lockfile is the source of truth
npm run dev   # http://localhost:3000
```

Other commands:

```bash
npm run build      # static export into out/
npm run typecheck  # what CI runs before it builds
npm start          # serve the built out/ folder, to check the real export
```

Node 22 or newer. CI is pinned to Node 22.

---

## Changing things

### Replacing the CV

1. Put the new PDF in `public/`, named with the year and month:
   `Harshal-Abdulla-CV-2026-11.pdf`. The date is in the filename on purpose, so a
   stale file is obvious to you and to whoever downloads it.
2. Open `content/profile.ts` and update **both** `cvPath` and `cvSize`.
3. Delete the old PDF.

That is all. The nav, the hero button and the about page all read those two
values, so they update together.

**Or regenerate it from this repo:** the CV is written as HTML in
`tools/cv/cv.html`. Edit it and run `./tools/cv/build-cv.sh`, which renders it to
PDF using the Chrome already on your Mac. There is no PDF dependency in
`package.json` and nothing to install.

### Editing what a project says

Everything factual lives in two files and nowhere else:

- `content/profile.ts` — name, contact, headline, education, experience, the CV
- `content/projects.ts` — the three case-study projects, the figures, the tables,
  and the "also built" entries

Change the text there and every page that uses it updates. You should almost never
need to open a file in `app/` to change wording.

### Adding a project

1. Add an entry to `PROJECTS` in `content/projects.ts`. The `slug` becomes the URL.
2. Create `app/work/<slug>/page.tsx`. Copy `app/work/sketchpad/page.tsx`, it is the
   simplest one.

The home page and `sitemap.xml` pick it up automatically from the array.

### Adding a live demo link

Set `demoUrl` on the project in `content/projects.ts`. A "Live demo" link appears
on the home page card and in the case study header. Nothing else to do.

---

## Rules that are not negotiable

These protect a real client and a real working relationship. They matter more than
anything else in this repository.

1. **Never name the restaurant.** "A restaurant in Co. Kildare" is as specific as it
   ever gets. No name, no street, no signage, no branding, no named menu, no
   recognisable interior, in any image or any sentence, anywhere, including work
   history.
2. **Never publish revenue.** Order counts and dish counts are fine. Takings, the
   cash and card split, and average order value are not.
3. **Never say or imply a customer was overcharged.** It is false. The wording in the
   pricing section of `app/work/restaurant/page.tsx` was written carefully. Do not
   loosen it.
4. **No code from the private repository, anywhere.** The line is: the code is
   private, it is a client's live system, happy to walk through any part of it on a
   call.

Also permanently excluded: your phone number, your visa or immigration status,
InLighnX / InLighn Tech, LinkedIn Learning certificates, and any claim from an older
CV that this repository does not already state.

**Do not add a fact you cannot defend in an interview.** If you cannot point at where
a number came from, it does not go on the site.

---

## Deployment

Push to `main`. That is the whole process.

`.github/workflows/deploy.yml` runs on every push: `npm ci`, typecheck, build, then
upload `out/` and deploy to GitHub Pages. It takes a couple of minutes and the
Actions tab shows failures.

One-time setup, in this repository's **Settings → Pages**, set **Source** to
**GitHub Actions**. Without that, the workflow runs green and deploys nothing.

Notes:

- The repository is named `Harshal-Abdulla.github.io`, which is what gives the clean
  root URL. Renaming it means adding a `basePath` in `next.config.ts` and updating
  `SITE_URL` in `content/profile.ts`.
- `public/.nojekyll` stops GitHub eating files that start with an underscore. Leave
  it there.
- No custom domain. A domain is the one thing that can take this site offline, and
  the `github.io` URL is free, permanent, and tied to the same account as the code.

### Before you call a change done

- Every external link still opens
- `npm run build` succeeds from a clean `npm ci`
- Nothing in `out/` reaches the network at runtime
- Images are committed files, with explicit width and height

---

## Layout

```
app/                 pages. one folder per route
  work/<slug>/       one case study each
components/
  ui/                Panel, Button, Tag, Ledger, SectionHeader
  motion/            Reveal, Stagger, CountUp, MotionProvider
  layout/            Nav, Footer, AmbientField, SkipLink
  work/              KafkaDiagram, PricingTable, DemoCard, StackedCards, SubNav
content/             every fact on the site
public/              fonts, images, the CV, og.png
tools/               not part of the build. CV source and the OG image generator
```

Design tokens (colours, fonts, the glass panel, the background) are all in
`app/globals.css` at the top. Change a colour there and it changes everywhere.

Animation obeys `prefers-reduced-motion` everywhere, and the site is fully readable
with JavaScript disabled. If you add animation, keep both true.

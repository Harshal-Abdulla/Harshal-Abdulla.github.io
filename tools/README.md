# tools/

Nothing in here runs during a build or a deploy. It is kept so the Open Graph
image can be regenerated if the wording on it should ever change.

## Regenerating public/og.png

`public/og.png` is a committed file, which is how every image on this site
works. It was produced once from `opengraph-image.tsx.bak`:

1. Copy `opengraph-image.tsx.bak` to `app/opengraph-image.tsx`.
2. Edit the wording in it.
3. `npm run build`
4. `cp out/opengraph-image public/og.png`
5. Delete `app/opengraph-image.tsx` again and rebuild.

It is done this way rather than left as a build-time route because Next exports
that route as a file with no extension, which GitHub Pages then serves with the
wrong content type, and most link previewers refuse it.

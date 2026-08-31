/**
 * The background the glass panels sit above. Part 5.2.
 *
 * A warm amber core falling off through a cool violet into the base colour,
 * over a faint technical grid that is masked out toward the edges. It reads as
 * instrumentation rather than decoration, and because it is a field rather than
 * a picture it never competes with the text on top of it.
 *
 * Pure CSS, in globals.css. No image file, no canvas, no WebGL, no particles.
 * It is decorative, so it is hidden from assistive technology.
 */
export default function AmbientField() {
  return (
    <div className="ambient-field" aria-hidden="true">
      <div className="ambient-field__glow" />
      <div className="ambient-field__grid" />
    </div>
  );
}

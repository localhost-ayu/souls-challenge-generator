/*
 * Decorative backdrop: grain, vignette and a low bonfire glow with a few
 * rising embers. Positions are fixed (not random) so the server and client
 * render the same markup.
 */
const EMBERS = [
  { x: 46, size: 3, duration: 9, delay: 0, drift: -18 },
  { x: 52, size: 2, duration: 11, delay: 2.5, drift: 22 },
  { x: 49, size: 2, duration: 8, delay: 5, drift: -8 },
  { x: 55, size: 3, duration: 12, delay: 1.2, drift: 30 },
  { x: 43, size: 2, duration: 10, delay: 6.8, drift: -26 },
  { x: 50, size: 4, duration: 13, delay: 3.6, drift: 12 },
  { x: 58, size: 2, duration: 9.5, delay: 8.1, drift: 18 },
  { x: 40, size: 2, duration: 11.5, delay: 4.4, drift: -14 },
  { x: 53, size: 2, duration: 10.5, delay: 9.6, drift: -20 },
  { x: 47, size: 3, duration: 12.5, delay: 7.2, drift: 26 },
];

export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="vignette" />
      <div className="bonfire-glow" />
      {EMBERS.map((ember, index) => (
        <span
          key={index}
          className="ember"
          style={
            {
              "--ember-x": `${ember.x}%`,
              "--ember-size": `${ember.size}px`,
              "--ember-duration": `${ember.duration}s`,
              "--ember-delay": `${ember.delay}s`,
              "--ember-drift": `${ember.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <div className="grain" />
    </div>
  );
}

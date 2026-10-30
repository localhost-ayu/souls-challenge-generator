/*
 * Decorative backdrop: a low bonfire glow, grain, a few rising embers and a
 * vignette. Positions are fixed (not random) so the server and client render
 * the same markup.
 */
const EMBERS = [
  { left: 12, delay: 0, duration: 14 },
  { left: 24, delay: 5, duration: 18 },
  { left: 41, delay: 9, duration: 14 },
  { left: 58, delay: 2, duration: 20 },
  { left: 73, delay: 7, duration: 14 },
  { left: 88, delay: 11, duration: 16 },
];

export function Atmosphere() {
  return (
    <div aria-hidden="true" className="atmos">
      <div className="atmos-glow" />
      <svg className="atmos-grain" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {EMBERS.map((ember) => (
        <span
          key={ember.left}
          className="ember-dot"
          style={{
            left: `${ember.left}%`,
            animationDelay: `${ember.delay}s`,
            animationDuration: `${ember.duration}s`,
          }}
        />
      ))}
      <div className="atmos-vignette" />
    </div>
  );
}

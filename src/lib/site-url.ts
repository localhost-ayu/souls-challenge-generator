/**
 * Absolute origin used for metadata, robots and sitemap. Read at build time
 * only: Vercel sets VERCEL_PROJECT_PRODUCTION_URL (the production domain,
 * custom or not) automatically, so no configuration is needed.
 */
export const SITE_URL = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
);

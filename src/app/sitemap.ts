import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

// /run and /history depend on a seed or on the visitor's browser, so only
// the shared pages are listed.
const ROUTES = ["/", "/play", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: new URL(path, SITE_URL).toString() }));
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Signed-in app areas: nothing there is useful in search, and it's all behind auth. */
const PRIVATE_PATHS = ["/dashboard", "/admin", "/onboarding", "/api/"];

export default function robots(): MetadataRoute.Robots {
  // Vercel preview/staging deployments must never compete with duevy.app.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

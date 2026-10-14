import type { Metadata } from "next";

/** Canonical production origin. Every canonical URL and share card points here. */
export const SITE_URL = "https://duevy.app";
export const SITE_NAME = "Duevy";
export const SUPPORT_EMAIL = "support@duevy.app";
export const SOCIAL = {
  x: "https://x.com/duevyapp",
  instagram: "https://instagram.com/duevyapp",
} as const;

export const DEFAULT_TITLE = "Duevy — Collect campus dues by bank transfer. No wahala.";
export const DEFAULT_DESCRIPTION =
  "Duevy helps course reps and departments in Nigerian universities collect dues and levies by bank transfer, track who has paid, and give every student a receipt.";

export const OG_IMAGE = {
  url: "/ogimage.png",
  width: 1352,
  height: 648,
  alt: "Duevy — Campus dues, made transparent.",
};

/**
 * Metadata for one page: title, description, its own canonical URL and a
 * matching share card. `noindex` keeps utility pages (password resets, invite
 * links, the app itself) out of search results while still letting crawlers
 * follow their links.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title?: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const desc = description ?? DEFAULT_DESCRIPTION;
  const shareTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      locale: "en_NG",
      title: shareTitle,
      description: desc,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      site: "@duevyapp",
      creator: "@duevyapp",
      title: shareTitle,
      description: desc,
      images: [OG_IMAGE.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** For private app areas: never index, never show a cached copy or snippet. */
export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

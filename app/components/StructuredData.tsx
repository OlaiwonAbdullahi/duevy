import { faqs } from "./faq-data";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL,
  SUPPORT_EMAIL,
} from "@/lib/seo";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/**
 * Homepage JSON-LD: who runs Duevy, the site, the app itself and the FAQ, as
 * one linked graph. Rendered server-side so crawlers get it in the HTML.
 */
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
      email: SUPPORT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        areaServed: "NG",
        availableLanguage: ["en"],
      },
      sameAs: [SOCIAL.x, SOCIAL.instagram],
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "en-NG",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      areaServed: { "@type": "Country", name: "Nigeria" },
      audience: {
        "@type": "Audience",
        audienceType: "University course reps, departments and students",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "NGN",
        description: "Free to sign up. A small fee applies per payment and withdrawal.",
      },
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // Escape `<` so no string in the data can close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}

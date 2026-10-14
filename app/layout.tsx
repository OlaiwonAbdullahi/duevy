import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PwaRegister } from "./components/pwa/PwaRegister";
import { PwaChrome } from "./components/pwa/PwaChrome";
import { MotionProvider } from "./components/MotionProvider";
import { API_BASE_URL } from "@/lib/api/config";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Duevy",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "campus dues collection Nigeria",
    "student dues payment",
    "departmental levies",
    "course rep payments",
    "class rep payments app",
    "pay dues by bank transfer",
    "Nigerian university",
    "duevy",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  // No `url` or canonical here: each public page sets its own via
  // `pageMetadata`, so nothing inherits the homepage's address by accident.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    site: "@duevyapp",
    creator: "@duevyapp",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logos/duevy-mark.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: { telephone: false, email: false, address: false },
  verification: {
    google: "WEy1-91z9uLiwxT_n-bqejxqRgkrICkh4amNML1P4E4",
  },
};

export const viewport: Viewport = {
  // Lets the installed app draw under the home indicator; the dashboard's tab
  // bar pads itself with env(safe-area-inset-bottom).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b6e4f" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1411" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Open the TLS connection to the API while the page is still loading, so the
  // session bootstrap (/auth/refresh) doesn't pay DNS + TCP + TLS on top.
  // Credentialed, to match the client's `credentials: "include"` fetches.
  preconnect(new URL(API_BASE_URL).origin, { crossOrigin: "use-credentials" });

  return (
    <html
      lang="en-NG"
      className={cn("h-full antialiased", manrope.variable)}
      suppressHydrationWarning // Prevents secondary hydration attribute variations
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <AuthProvider>
              {children}
              <PwaChrome />
            </AuthProvider>
          </MotionProvider>
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </ThemeProvider>
        {/* Sabilytics web analytics */}
        <Script
          src="https://www.sabilytics.com/script.js"
          data-site="wo9uj1iedb40"
          data-domain="duevy.app"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

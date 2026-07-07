import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = "https://duevy.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Duevy — University Payments, Simplified",
    template: "%s | Duevy",
  },
  description:
    "Duevy is the digital payment layer for university students — pay dues, handouts, and departmental fees instantly.",
  keywords: [
    "university payments Nigeria",
    "student dues payment",
    "departmental fees",
    "Nigerian university fintech",
    "course rep payments",
    "university payment app",
    "duevy",
  ],
  authors: [{ name: "Duevy", url: BASE_URL }],
  creator: "Duevy",
  publisher: "Duevy",
  category: "fintech",

  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Duevy",
    title: "Duevy — University Payments, Simplified",
    description:
      "Pay university dues, handouts, and departmental fees instantly with Duevy.",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "Duevy — University payments, finally simplified.",
      },
    ],
    locale: "en_NG",
  },

  twitter: {
    card: "summary_large_image",
    site: "@duevyapp",
    creator: "@duevyapp",
    title: "Duevy — University Payments, Simplified",
    description:
      "Pay university dues, handouts, and departmental fees instantly with Duevy.",
    images: ["/ogimage.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", dmSans.variable, bricolageGrotesque.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

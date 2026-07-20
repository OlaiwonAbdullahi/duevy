import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SmoothScroll from "./components/SmoothScroll";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PwaRegister } from "./components/pwa/PwaRegister";
import { InstallBanner } from "./components/pwa/InstallBanner";
import { NetworkIndicator } from "./components/pwa/NetworkIndicator";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const BASE_URL = "https://duevy.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Duevy — Collect dues. Track every kobo. No wahala.",
    template: "%s | Duevy",
  },
  description:
    "Duevy gives Nigerian campus reps a simple way to collect dues, levies, and payments — while every student sees exactly where their money went.",
  keywords: [
    "campus dues collection Nigeria",
    "student dues payment",
    "departmental levies",
    "Nigerian university fintech",
    "course rep payments",
    "class rep payments app",
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
    title: "Duevy — Collect dues. Track every kobo. No wahala.",
    description:
      "A simple way for campus reps to collect dues and levies — with full transparency for every student.",
    images: [
      {
        url: "/ogimage.png",
        width: 1352,
        height: 648,
        alt: "Duevy — Campus dues, made transparent.",
      },
    ],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    site: "@duevyapp",
    creator: "@duevyapp",
    title: "Duevy — Collect dues. Track every kobo. No wahala.",
    description:
      "A simple way for campus reps to collect dues and levies — with full transparency for every student.",
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
    apple: "/icons/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Duevy",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
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
  return (
    <html
      lang="en"
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
          <SmoothScroll />
          <AuthProvider>
            {children}
            <NetworkIndicator />
            <InstallBanner />
          </AuthProvider>
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

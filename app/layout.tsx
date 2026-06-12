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

export const metadata: Metadata = {
  title: "Duevy — University Payments, Simplified",
  description:
    "The all-in-one payment platform for Nigerian university students. Pay dues, handouts, and departmental fees instantly — no more WhatsApp chasing.",
  openGraph: {
    title: "Duevy",
    description: "University payments, finally simplified.",
    url: "https://duevy.app",
    siteName: "Duevy",
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

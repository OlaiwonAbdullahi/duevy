import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Duevy",
  url: "https://duevy.app",
  description:
    "The digital payment layer for university students. Pay dues, handouts, and departmental fees instantly.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "NGN",
  },
  author: {
    "@type": "Organization",
    name: "Duevy",
    url: "https://duevy.app",
    email: "useduevy@gmail.com",
    sameAs: ["https://x.com/duevyapp", "https://instagram.com/duevyapp"],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#faf9f5] overflow-x-hidden">
        <Navbar />
        <Hero />
        <Ticker />
        <HowItWorks />
        <Features />
        <CTA />
        <Footer />
      </main>
    </>
  );
}

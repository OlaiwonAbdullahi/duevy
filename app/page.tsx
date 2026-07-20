import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import Problem from "./components/Problem";
import Solution from "./components/Solution";
import Personas from "./components/Personas";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Stats from "./components/Stats";
import FAQ from "./components/FAQ";
import Pricing from "./components/Pricing";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Duevy",
  url: "https://duevy.app",
  description:
    "A simple way for Nigerian campus reps to collect dues and levies transparently — every student sees where their money went.",
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
      <main className="min-h-screen bg-[#fbfaf7]">
        <Navbar />
        <Reveal>
          <Hero />
        </Reveal>
        <Reveal>
          <TrustBar />
        </Reveal>
        <Reveal>
          <Problem />
        </Reveal>
        {/* <Solution /> */}
        <Reveal>
          <Personas />
        </Reveal>
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        {/*
        <Stats />
        */}
        <Reveal>
          <FAQ />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <CTA />
        </Reveal>
        <Reveal>
          <Footer />
        </Reveal>
      </main>
    </>
  );
}

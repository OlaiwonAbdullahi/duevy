import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Personas from "./components/Personas";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Pricing from "./components/Pricing";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import SmoothScroll from "./components/SmoothScroll";
import { StructuredData } from "./components/StructuredData";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default function Page() {
  return (
    <>
      <SmoothScroll />
      <StructuredData />
      <main className="min-h-screen bg-[#fbfaf7]">
        <Navbar />
        <Reveal>
          <Hero />
        </Reveal>
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

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#faf9f5] overflow-x-hidden">
      <Navbar />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}

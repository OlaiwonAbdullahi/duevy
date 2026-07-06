"use client";

import { useState, useEffect } from "react";
import { ArrowRightIcon, CloseIcon } from "./icons";
import Image from "next/image";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="sticky top-0 z-50 p-4">
      <div
        className={`relative mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "max-w-4xl mt-3 h-14 px-2 md:px-3 rounded-full border border-white/60 bg-[#fbfaf7]/40 backdrop-blur-2xl backdrop-saturate-150 "
            : "max-w-6xl mt-0 h-18 px-6 md:px-12 rounded-none border border-transparent bg-[#fbfaf7]/70 backdrop-blur-md"
        }`}
      >
        <a href="#" className="flex items-center gap-2 cursor-pointer">
          <Image
            src="/icons/logo2.svg"
            alt="Duevy Logo"
            width={25}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="text-[#1b2520]  text-xl tracking-tight">Duevy.</span>
        </a>

        {/* Desktop nav — centered */}
        <div className="hidden lg:flex items-center bg-[#f4f2ec] rounded-full text-[#7a847f] gap-2 absolute left-1/2 -translate-x-1/2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className=" text-[13px] font-medium rounded-full px-3 py-1.5 hover:bg-[#e6f2ec] hover:text-[#1b2520] transition-colors duration-300 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="">
          <a
            href="#"
            className="hidden lg:inline-flex items-center gap-2 text-[13px] font-semibold rounded-full px-5 py-2.5  transition-colors duration-300 cursor-pointer group"
          >
            Sign in
          </a>
          <a
            href="#"
            className="hidden lg:inline-flex items-center gap-2 bg-[#0b6e4f] text-white text-[13px] font-semibold rounded-full px-5 py-2.5 hover:bg-[#0f996d] transition-colors duration-300 cursor-pointer group"
          >
            Get started
            <ArrowRightIcon
              size={15}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="lg:hidden relative z-50 w-11 h-11 grid place-items-center rounded-full bg-[#f4f2ec] hover:bg-[#e6f2ec] transition-colors duration-300 cursor-pointer"
        >
          <span className="relative block w-5 h-2.5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-[#1b2520] transition-transform duration-300 ${
                open ? "translate-y-1 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 h-0.5 w-5 bg-[#1b2520] transition-transform duration-300 ${
                open ? "-translate-y-1 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile full-screen menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-[#fbfaf7] flex flex-col transition-all duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute top-7 right-7 w-11 h-11 grid place-items-center rounded-full bg-[#f4f2ec] text-[#1b2520] hover:bg-[#e6f2ec] transition-colors duration-300 cursor-pointer"
        >
          <CloseIcon size={20} />
        </button>

        <div className="flex-1 flex flex-col justify-center px-8 gap-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[#1b2520] text-3xl font-semibold py-3 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="px-8 pb-12 flex flex-col gap-3">
          <a
            href="#"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 bg-[#f4f2ec] text-[#1b2520] text-base font-semibold rounded-full px-6 h-[52px] cursor-pointer"
          >
            Sign in
          </a>
          <a
            href="#"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 bg-[#0b6e4f] text-white text-base font-semibold rounded-full px-6 h-[52px] hover:bg-[#0f996d] transition-colors duration-300 cursor-pointer"
          >
            Get started
            <ArrowRightIcon size={16} />
          </a>
        </div>
      </div>
    </nav>
  );
}

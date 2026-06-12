"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon } from "./icons";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative z-10 px-6 md:px-12 pt-24 pb-20 max-w-6xl mx-auto flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 border border-[#10B981]/30 bg-[#10B981]/[0.05] px-4 py-2 mb-10">
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#10B981] flex items-center gap-1.5">
          We&apos;re building something big
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 4l2 2M8 2v3M2 8h3"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeLinecap="square"
            />
            <path
              d="M7 13l8 8"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeLinecap="square"
            />
            <path
              d="M11 9l4 4-6 6-4-4 6-6z"
              fill="#10B981"
              fillOpacity="0.2"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeLinejoin="miter"
            />
            <circle cx="19" cy="5" r="1.5" fill="#10B981" fillOpacity="0.5" />
            <circle cx="21" cy="10" r="1" fill="#10B981" fillOpacity="0.3" />
            <circle cx="15" cy="3" r="1" fill="#10B981" fillOpacity="0.4" />
          </svg>
        </span>
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-6 max-w-4xl">
        University dues,
        <br />
        <span className="text-[#10B981]">finally simplified.</span>
      </h1>

      <p className="text-lg md:text-xl text-black/45 max-w-xl leading-relaxed mb-12 font-light">
        No more WhatsApp chasing. No more manual bank transfers. No more forms.
        Duevy is the digital payment layer every Nigerian university department
        needs.
      </p>

      <div className="w-full max-w-md">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your university email"
              required
              className="flex-1 bg-black/[0.03] border border-black/[0.12] border-r-0 px-4 py-3.5 text-sm text-[#0f172a] placeholder:text-black/30 outline-none focus:border-[#10B981] transition-all"
            />
            <button
              type="submit"
              className="bg-[#10B981] text-white px-6 py-3.5 text-sm font-bold tracking-wide flex items-center gap-2 hover:bg-[#0ea572] transition-colors whitespace-nowrap"
            >
              Join Waitlist
              <ArrowRightIcon size={16} />
            </button>
          </form>
        ) : (
          <div className="border border-[#10B981]/30 bg-[#10B981]/[0.05] px-6 py-4 flex items-center gap-3">
            <div className="w-6 h-6 bg-[#10B981] flex items-center justify-center shrink-0">
              <CheckIcon size={13} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#0f172a]">
                You&apos;re on the list.
              </p>
              <p className="text-xs text-black/45 mt-0.5">
                We&apos;ll reach out to{" "}
                <span className="text-[#10B981]">{email}</span> when we launch.
              </p>
            </div>
          </div>
        )}
        <p className="text-xs text-black/25 mt-3">
          Join 200+ students & course reps already waiting.
        </p>
      </div>
    </section>
  );
}

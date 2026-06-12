"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon } from "./icons";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section
      className="px-6 md:px-12 py-24 bg-[#faf9f5]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-[40px] md:text-[48px] font-bold leading-[1.2] text-[#030c0a] mb-4">
          Be among the first to use Duevy.
        </h2>
        <p className="text-xl font-normal leading-relaxed text-[#374151] mb-10">
          Whether you&apos;re a course rep tired of chasing payments or a
          student tired of manual transfers — this is for you.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@university.edu.ng"
              required
              className="flex-1 bg-white border border-[#e5e7eb] border-r-0 px-4 py-3 text-sm text-[#030c0a] placeholder:text-[#374151]/40 outline-none focus:border-[#10b981] transition-all cursor-text"
            />
            <button
              type="submit"
              className="bg-[#10b981] text-white text-xs font-semibold px-6 py-3 hover:bg-[#0ea572] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              Get Early Access
              <ArrowRightIcon size={14} />
            </button>
          </form>
        ) : (
          <div className="border border-[#e5e7eb] bg-white px-6 py-4 flex items-center gap-3 max-w-md mx-auto">
            <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center shrink-0">
              <CheckIcon size={13} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#030c0a]">
                You&apos;re on the list.
              </p>
              <p className="text-xs text-[#374151] mt-0.5">
                We&apos;ll reach out to{" "}
                <span className="text-[#10b981] font-medium">{email}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

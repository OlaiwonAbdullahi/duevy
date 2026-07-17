import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon } from "./icons";
import { CheckCircle } from "@hugeicons/core-free-icons";

export default function Hero() {
  return (
    <section className="bg-[#fbfaf7] px-6 md:px-12 pt-20 pb-24 md:pt-24 md:pb-32">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        <span className="inline-flex items-center  text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
          <HugeiconsIcon icon={CheckCircle} size={16} className="mr-1" />
          Built for campus reps and students
        </span>

        <h1 className="text-[#1b2520] font-semibold tracking-tight text-[2.25rem] sm:text-5xl lg:text-[3.75rem] leading-[1.05] mb-6">
          Collect dues. Track every kobo.{" "}
          <span className="relative inline-block text-[#0b6e4f]">
            No wahala.
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/line.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none absolute left-0 -bottom-2 sm:-bottom-3 w-full h-auto"
            />
          </span>
        </h1>

        <p className="text-[#7a847f] text-base md:text-lg leading-relaxed max-w-xl mb-10">
          Duevy gives course reps a simple wallet-based way to collect dues,
          levies, and payments. Students pay in a tap, Pay for dues in few
          clicks and vote on paid poll.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-[#0b6e4f] text-white text-base font-semibold rounded-full px-7 h-[52px] hover:bg-[#0f996d] transition-colors duration-300 cursor-pointer group"
          >
            Get started
            <ArrowRightIcon
              size={16}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center bg-[#f4f2ec] text-[#1b2520] text-base font-semibold rounded-full px-7 h-[52px] hover:bg-[#e6f2ec] transition-colors duration-300 cursor-pointer"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

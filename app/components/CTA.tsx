import { ArrowRightIcon } from "./icons";

export default function CTA() {
  return (
    <section className="bg-[#e6f2ec] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-[#0b6e4f] rounded-[32px] px-8 py-16 md:px-16 md:py-20 text-center flex flex-col items-center">
          <h2 className="text-white font-semibold tracking-tight text-3xl md:text-4xl leading-tight max-w-3xl mb-4">
            Ready to run campus money the clean way?
          </h2>
          <p className="text-[#e6f2ec] text-base leading-relaxed max-w-xl mb-10">
            Whether you&apos;re collecting dues or paying them, Duevy keeps
            everyone honest.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-[#fbfaf7] text-[#1b2520] text-base font-semibold rounded-full px-7 h-[52px] hover:bg-[#f4f2ec] transition-colors duration-300 cursor-pointer group"
            >
              Start collecting
              <ArrowRightIcon size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center bg-[#0f996d] text-white text-base font-semibold rounded-full px-7 h-[52px] hover:bg-[#08583f] transition-colors duration-300 cursor-pointer"
            >
              I&apos;m a student
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

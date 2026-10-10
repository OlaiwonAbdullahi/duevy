import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export type LegalSection = { heading: string; body: string[] };

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      {/* Top bar */}
      <header className="px-6 md:px-12 py-6 border-b border-[#e6f2ec]">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-[#1b2520] text-xl tracking-tight cursor-pointer"
          >
            Duevy.
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 text-[#0b6e4f] text-[14px] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
          >
            Create account
            <ArrowRightIcon
              size={15}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </header>

      {/* Document */}
      <article className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-[720px] mx-auto">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            Last updated {updated}
          </span>
          <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight mb-5">
            {title}
          </h1>
          <p className="text-[#7a847f] text-lg leading-relaxed mb-12">
            {intro}
          </p>

          <div className="flex flex-col gap-10">
            {sections.map((section, i) => (
              <section key={section.heading}>
                <h2 className="text-[#1b2520] font-semibold text-xl mb-3">
                  {i + 1}. {section.heading}
                </h2>
                <div className="flex flex-col gap-3">
                  {section.body.map((paragraph, j) => (
                    <p
                      key={j}
                      className="text-[#7a847f] text-base leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-14 pt-8 border-t border-[#e6f2ec] text-[#7a847f] text-sm leading-relaxed">
            Questions? Reach us at{" "}
            <a
              href="mailto:useduevy@gmail.com"
              className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
            >
              useduevy@gmail.com
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}

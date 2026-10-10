import { ShieldIcon } from "./icons";

const rails = [
  { name: "Monnify", domain: "monnify.com" },
  { name: "Nomba", domain: "nomba.com" },
];

export default function TrustBar() {
  return (
    <section className="bg-[#e6f2ec] px-6 md:px-12 py-16 md:py-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 text-[#0b6e4f] text-sm font-semibold mb-4">
          <ShieldIcon size={18} className="text-[#0b6e4f]" />
          Powered by trusted rails
        </span>
        <p className="text-[#1b2520] text-base md:text-lg leading-relaxed max-w-3xl mb-10">
          Every payment moves on Monify. Funds sit in secure, partitioned
          accounts —{" "}
          <span className="font-semibold">
            student money and platform money never mix
          </span>
          . NDPR-compliant by design.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {rails.map((rail) => (
            <span
              key={rail.name}
              className="inline-flex items-center gap-2.5 rounded-full pl-3 pr-5 py-2.5 border border-[#e6f2ec]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://icons.duckduckgo.com/ip3/${rail.domain}.ico`}
                alt={`${rail.name} logo`}
                width={24}
                height={24}
                className="w-6 h-6 rounded"
                loading="lazy"
              />
              <span className="text-[#1b2520] font-semibold text-base">
                {rail.name}
              </span>
            </span>
          ))}

          <span className="inline-flex items-center gap-2.5  rounded-full pl-3 pr-5 py-2.5 border border-[#e6f2ec]">
            <span className="w-6 h-6 rounded-full bg-[#0b6e4f] text-white grid place-items-center">
              <ShieldIcon size={14} className="text-white" />
            </span>
            <span className="text-[#1b2520] font-semibold text-base">
              CBN / NDPR
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

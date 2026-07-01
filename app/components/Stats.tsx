const stats = [
  { value: "2M+", label: "students across Nigerian universities paying dues every session" },
  { value: "100%", label: "of payments logged and traceable" },
  { value: "0", label: "cash counting, missing receipts, or “trust me” moments" },
  { value: "1", label: "wallet for every payment on campus" },
];

export default function Stats() {
  return (
    <section className="bg-[#e6f2ec] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#fbfaf7] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            The numbers
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            Real problems, real scale.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#fbfaf7] rounded-3xl border border-[#e6f2ec] p-6"
            >
              <p className="text-[#0b6e4f] font-semibold tracking-tight text-4xl md:text-5xl mb-4">
                {stat.value}
              </p>
              <p className="text-[#7a847f] text-base leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[#7a847f] text-sm mt-8">
          Swap in real figures once you have pilot data from LAUTECH.
        </p>
      </div>
    </section>
  );
}

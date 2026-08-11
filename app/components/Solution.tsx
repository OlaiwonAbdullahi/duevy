import { CardIcon, EyeIcon, ShieldIcon } from "./icons";

const blocks = [
  {
    icon: CardIcon,
    title: "Direct card & transfer collection",
    body: "Students pay dues, levies, and fees straight from a saved card or bank transfer in seconds. No chasing transfers or counting cash.",
  },
  {
    icon: EyeIcon,
    title: "Transparent by default",
    body: "Every student sees what was collected, who has paid, and what the money was spent on. No more “trust me.”",
  },
  {
    icon: ShieldIcon,
    title: "Reps stay accountable",
    body: "Every department gets its own verified payout account, and every withdrawal is logged and traceable back to who requested it.",
  },
];

export default function Solution() {
  return (
    <section className="bg-[#e6f2ec] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#fbfaf7] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            What Duevy does
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            Three ways Duevy keeps campus money clean.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {blocks.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-[#fbfaf7] rounded-3xl border border-[#e6f2ec] p-6 flex flex-col"
            >
              <span className="w-12 h-12 rounded-full bg-[#e6f2ec] text-[#0b6e4f] grid place-items-center mb-6">
                <Icon size={22} className="text-[#0b6e4f]" />
              </span>
              <h3 className="text-[#1b2520] font-semibold text-lg mb-3">{title}</h3>
              <p className="text-[#7a847f] text-base leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

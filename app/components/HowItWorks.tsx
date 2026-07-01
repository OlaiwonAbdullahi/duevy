const steps = [
  {
    number: "01",
    title: "Rep sets up their dept",
    body: "Names it (e.g. “200L CSC Department”), sets the team and roles.",
  },
  {
    number: "02",
    title: "Students get the link",
    body: "Shared on WhatsApp or the class group. No app to install to pay.",
  },
  {
    number: "03",
    title: "Students top up & pay",
    body: "Fund the Duevy wallet, pay in seconds, get an instant receipt.",
  },
  {
    number: "04",
    title: "Payout needs approval",
    body: "When the rep wants to spend, a quorum of students approves first.",
  },
  {
    number: "05",
    title: "Money moves, cleanly",
    body: "Funds release to the verified destination. Full trail kept for handover.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#fbfaf7] px-6 md:px-12 py-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="inline-flex items-center bg-[#e6f2ec] text-[#0b6e4f] text-[13px] font-medium rounded-full px-3 py-1 mb-6">
            How it works
          </span>
          <h2 className="text-[#1b2520] font-semibold tracking-tight text-3xl md:text-4xl leading-tight">
            One simple flow, from set-up to settled.
          </h2>
        </div>

        <div className="grid gap-4">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="bg-[#fbfaf7] rounded-3xl border border-[#e6f2ec] p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"
            >
              <div className="flex items-center gap-4 sm:w-72 shrink-0">
                <span className="w-12 h-12 rounded-full bg-[#0b6e4f] text-white grid place-items-center font-semibold text-lg shrink-0">
                  {i + 1}
                </span>
                <h3 className="text-[#1b2520] font-semibold text-lg leading-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-[#7a847f] text-base leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

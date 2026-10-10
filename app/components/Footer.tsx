import Image from "next/image";

// Only links that go somewhere; add more as their pages ship.
const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing-fee" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Contact", href: "mailto:useduevy@gmail.com" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#fbfaf7] border-t border-[#e6f2ec] px-6 md:px-12 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logos/duevy-mark.svg"
                alt=""
                width={28}
                height={28}
                className="h-6 w-auto"
              />
              <span className="text-[#1b2520] text-xl tracking-tight">
                Duevy.
              </span>
            </div>
            <p className="text-[#7a847f] text-base leading-relaxed max-w-xs">
              Campus dues, made transparent.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[#1b2520] font-semibold text-sm mb-4">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[#7a847f] text-[15px] font-medium hover:text-[#1b2520] transition-colors duration-300 cursor-pointer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#e6f2ec] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#7a847f] text-sm text-center sm:text-left">
            © 2026 Duevy · Built for Nigerian campuses
          </p>
          <div className=""></div>
        </div>
      </div>
    </footer>
  );
}

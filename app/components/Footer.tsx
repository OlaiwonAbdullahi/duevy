import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Demo", href: "#" },
    ],
  },
  {
    title: "Audience",
    links: [
      { label: "For Reps", href: "#" },
      { label: "For Students", href: "#" },
      { label: "For Departments", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Career", href: "#" },
    ],
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
                src="/icons/logo2.svg"
                alt=""
                width={25}
                height={32}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[#1b2520] font-semibold text-sm mb-4">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) =>
                    link.href.startsWith("/") ? (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-[#7a847f] text-[15px] font-medium hover:text-[#1b2520] transition-colors duration-300 cursor-pointer"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[#7a847f] text-[15px] font-medium hover:text-[#1b2520] transition-colors duration-300 cursor-pointer"
                        >
                          {link.label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#e6f2ec] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#7a847f] text-sm text-center sm:text-left">
            © 2026 Duevy Labs Ltd. All rights reserved.
          </p>
          <div className=""></div>
        </div>
      </div>
    </footer>
  );
}

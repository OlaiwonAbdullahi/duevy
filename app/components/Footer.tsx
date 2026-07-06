import Image from "next/image";

const columns = [
  {
    title: "Product",
    links: ["How it works", "Pricing", "Demo"],
  },
  {
    title: "Audience",
    links: ["For Reps", "For Students", "For Departments"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Career"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms"],
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
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-[#7a847f] text-[15px] font-medium hover:text-[#1b2520] transition-colors duration-300 cursor-pointer"
                      >
                        {link}
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

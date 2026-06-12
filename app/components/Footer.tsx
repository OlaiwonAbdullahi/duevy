import { MailIcon, XIcon, InstagramIcon } from "./icons";

export default function Footer() {
  return (
    <footer className="bg-[#faf9f5] border-t border-[#e5e7eb] px-6 md:px-12 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <h2 className="font-semibold text-[#030c0a] text-sm">Duevy</h2>
          <span className="text-[#374151]/30 text-xs">·</span>
          <span className="text-[#374151]/50 text-xs">duevy.app</span>
        </div>

        {/* Links — navigation-item style */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#374151]">
          <a
            href="mailto:useduevy@gmail.com"
            className="flex items-center gap-1.5 hover:text-[#10b981] transition-all cursor-pointer"
          >
            <MailIcon size={14} />
            useduevy@gmail.com
          </a>
          <a
            href="https://x.com/duevyapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#10b981] transition-all cursor-pointer"
          >
            <XIcon size={14} />
            @duevyapp
          </a>
          <a
            href="https://instagram.com/duevyapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#10b981] transition-all cursor-pointer"
          >
            <InstagramIcon size={14} />
            @duevyapp
          </a>
        </div>

        <p className="text-xs text-[#374151]/40">
          © 2026 Duevy. Built for Nigerian students.
        </p>
      </div>
    </footer>
  );
}

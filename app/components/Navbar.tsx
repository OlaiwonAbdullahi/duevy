export default function Navbar() {
  return (
    <nav className="bg-[#faf9f5] border-b border-[#e5e7eb] px-6 md:px-12 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-semibold text-[#030c0a] text-lg tracking-tight">
            Duevy
          </h2>
        </div>

        <span className="inline-flex items-center gap-1.5 border border-[#e5e7eb] bg-white text-[#10b981] text-xs font-semibold px-3 py-1 cursor-default">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full pulse-glow" />
          Coming Soon
        </span>
      </div>
    </nav>
  );
}

import Image from "next/image";

export default function DashboardPreview() {
  return (
    <section className="bg-[#fbfaf7] px-6 md:px-12 pb-24 md:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[20px] md:rounded-[28px] bg-[#fff]/10  p-2 md:p-3 ">
          <div className="overflow-hidden rounded-[14px] md:rounded-[20px] border border-[#e3e1da] bg-white">
            <Image
              src="/dashboard.png"
              alt="Duevy rep dashboard showing collected and outstanding dues, collection rate, join code and quick actions"
              width={1356}
              height={649}
              priority
              quality={100}
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

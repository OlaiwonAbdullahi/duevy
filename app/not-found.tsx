import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Compass01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-xl tracking-tight text-ink cursor-pointer sm:left-10 sm:top-8"
      >
        <Image
          src="/icons/logo2.svg"
          alt=""
          width={25}
          height={32}
          className="h-6 w-auto"
        />
        Duevy.
      </Link>

      <div className="grid h-16 w-16 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={Compass01Icon} size={30} />
      </div>

      <p className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
        Error 404
      </p>
      <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        We can&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
        The link may be broken or the page may have moved. Let&apos;s get you
        back to somewhere familiar.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
        >
          Back to home
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-[52px] items-center justify-center rounded-full bg-paper px-7 text-base font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

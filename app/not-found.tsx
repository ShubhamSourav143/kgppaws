import Link from "next/link";
import { PawMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[65vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-mist">
        <PawMark className="h-10 w-10 -rotate-12 text-forest" />
      </span>
      <p className="eyebrow text-terracotta-deep">404</p>
      <h1 className="max-w-md text-balance font-display text-4xl font-bold text-forest-deep">
        This trail goes cold.
      </h1>
      <p className="max-w-md text-moss">
        The page you&apos;re after has wandered off — probably following the
        feeding rickshaw. Let&apos;s get you back somewhere warm.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">
          Back home
        </ButtonLink>
        <ButtonLink href="/adopt" variant="outline" size="lg">
          Meet the paws
        </ButtonLink>
      </div>
      <Link
        href="/report"
        className="mt-2 text-sm font-bold text-terracotta-deep underline underline-offset-4"
      >
        Need to report an animal? That&apos;s always one tap away.
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-gradient-blue sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 heading-display text-2xl sm:text-3xl">
          {t.notFound.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">{t.notFound.message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            {t.notFound.home}
          </Link>
          <Link href="/biens" className="btn-secondary">
            {t.notFound.properties}
          </Link>
        </div>
      </div>
    </main>
  );
}

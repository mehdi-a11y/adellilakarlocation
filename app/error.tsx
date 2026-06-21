"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
            <path
              d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="mt-6 heading-display text-2xl">{t.error.title}</h1>
        <p className="mt-3 text-ink-muted">{t.error.message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            {t.common.retry}
          </button>
          <Link href="/" className="btn-secondary">
            {t.notFound.home}
          </Link>
        </div>
      </div>
    </main>
  );
}

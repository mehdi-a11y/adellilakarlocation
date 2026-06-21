"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  function select(next: Locale) {
    if (next !== locale) setLocale(next);
  }

  return (
    <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => select("fr")}
        className={`rounded-full px-3 py-1.5 transition ${
          locale === "fr"
            ? "bg-brand-600 text-white"
            : "text-ink-muted hover:text-ink"
        }`}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => select("ar")}
        className={`rounded-full px-3 py-1.5 transition ${
          locale === "ar"
            ? "bg-brand-600 text-white"
            : "text-ink-muted hover:text-ink"
        }`}
        aria-pressed={locale === "ar"}
      >
        AR
      </button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

type SearchBarProps = {
  variant?: "hero" | "compact";
  availableWilayas?: string[];
};

export default function SearchBar({
  variant = "hero",
  availableWilayas = [],
}: SearchBarProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [ville, setVille] = useState("");
  const [type, setType] = useState("");
  const [capacite, setCapacite] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (ville.trim()) params.set("ville", ville.trim());
    if (type) params.set("type", type);
    if (capacite) params.set("capacite", capacite);
    router.push(`/biens${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid gap-3 rounded-2xl bg-white p-3 shadow-float sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] ${
        variant === "hero" ? "" : "border border-slate-200"
      }`}
    >
      <label className="flex flex-col gap-1 rounded-xl px-3 py-2 text-start transition hover:bg-slate-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {t.search.destination}
        </span>
        <select
          value={ville}
          onChange={(event) => setVille(event.target.value)}
          className="bg-transparent text-sm text-ink outline-none"
        >
          <option value="">{t.search.allWilayas}</option>
          {availableWilayas.map((wilaya) => (
            <option key={wilaya} value={wilaya}>
              {wilaya}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 rounded-xl px-3 py-2 text-start transition hover:bg-slate-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {t.search.propertyType}
        </span>
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="bg-transparent text-sm text-ink outline-none"
        >
          <option value="">{t.common.all}</option>
          <option value="villa">{t.common.villa}</option>
          <option value="appartement">{t.common.apartment}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 rounded-xl px-3 py-2 text-start transition hover:bg-slate-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {t.search.travelers}
        </span>
        <select
          value={capacite}
          onChange={(event) => setCapacite(event.target.value)}
          className="bg-transparent text-sm text-ink outline-none"
        >
          <option value="">{t.search.any}</option>
          <option value="2">2 {t.search.peoplePlus}</option>
          <option value="4">4 {t.search.peoplePlus}</option>
          <option value="6">6 {t.search.peoplePlus}</option>
          <option value="8">8 {t.search.peoplePlus}</option>
        </select>
      </label>

      <button type="submit" className="btn-primary h-full px-7 py-3 text-base">
        {t.search.submit}
      </button>
    </form>
  );
}

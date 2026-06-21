"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { PropertyImage } from "@/types/property";

type GalleryProps = {
  images: PropertyImage[];
  title: string;
  locale: Locale;
};

export default function Gallery({ images, title, locale }: GalleryProps) {
  const t = getDictionary(locale);
  const sorted = [...images].sort((a, b) => a.ordre - b.ordre);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = lightboxIndex !== null;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? i : (i + 1) % sorted.length));
      if (event.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? i : (i - 1 + sorted.length) % sorted.length
        );
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sorted.length]);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700">
        {t.common.noPhoto}
      </div>
    );
  }

  const cover = sorted[0];
  const rest = sorted.slice(1, 5);

  return (
    <>
      {sorted.length === 1 ? (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl"
        >
          <Image
            src={cover.url}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </button>
      ) : (
        <div className="grid gap-2 sm:gap-3 md:h-[480px] md:grid-cols-4 md:grid-rows-2">
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:aspect-auto md:h-full"
          >
            <Image
              src={cover.url}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </button>

          {rest.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setLightboxIndex(index + 1)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-auto md:h-full"
            >
              <Image
                src={image.url}
                alt={`${title} ${index + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              {index === 3 && sorted.length > 5 && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-semibold text-white">
                  +{sorted.length - 5} photos
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((i) =>
                i === null ? i : (i - 1 + sorted.length) % sorted.length
              )
            }
            className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Précédent"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image
              src={sorted[lightboxIndex].url}
              alt={`${title} ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setLightboxIndex((i) => (i === null ? i : (i + 1) % sorted.length))
            }
            className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Suivant"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {sorted.length}
          </span>
        </div>
      )}
    </>
  );
}

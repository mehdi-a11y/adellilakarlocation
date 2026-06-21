"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function onScroll() {
      const el = scrollRef.current;
      if (!el) return;
      const slideWidth = el.clientWidth;
      if (!slideWidth) return;
      const index = Math.round(el.scrollLeft / slideWidth);
      setActiveSlide(Math.min(index, sorted.length - 1));
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [sorted.length]);

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 text-brand-700">
        {t.common.noPhoto}
      </div>
    );
  }

  const cover = sorted[0];
  const rest = sorted.slice(1, 5);

  function scrollToSlide(index: number) {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      left: container.clientWidth * index,
      behavior: "smooth",
    });
    setActiveSlide(index);
  }

  return (
    <>
      {/* Mobile : carrousel horizontal */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden rounded-2xl"
            >
              <Image
                src={image.url}
                alt={`${title} ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex gap-1.5">
            {sorted.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => scrollToSlide(index)}
                aria-label={`Photo ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide
                    ? "w-6 bg-brand-600"
                    : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-ink-muted">
            {activeSlide + 1} / {sorted.length}
          </span>
        </div>
      </div>

      {/* Desktop : grille */}
      {sorted.length === 1 ? (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="group relative hidden aspect-[16/9] w-full overflow-hidden rounded-2xl md:block"
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
        <div className="hidden gap-2 sm:gap-3 md:grid md:h-[480px] md:grid-cols-4 md:grid-rows-2">
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
            className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
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

          <div className="relative h-[70vh] w-full max-w-5xl sm:h-[80vh]">
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
            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
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

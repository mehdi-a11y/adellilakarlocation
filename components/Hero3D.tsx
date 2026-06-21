"use client";

import { useRef } from "react";
import SearchBar from "@/components/SearchBar";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatPrice } from "@/lib/i18n";

type Hero3DProps = {
  available: number;
  availableWilayas: string[];
};

export default function Hero3D({ available, availableWilayas }: Hero3DProps) {
  const { locale, t } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  function applyTransform() {
    const stage = stageRef.current;
    if (!stage) return;
    const { x, y } = pointerRef.current;
    const scene = stage.querySelector<HTMLElement>("[data-hero-scene]");
    if (scene) {
      scene.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = {
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    };
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  }

  function resetPointer() {
    pointerRef.current = { x: 0, y: 0 };
    applyTransform();
  }

  return (
    <section
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="bg-mesh-blue relative isolate overflow-hidden"
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/30 blur-2xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-accent-400/25 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,18,32,0.6)_100%)]" />

      <div className="container relative grid min-h-[560px] items-center gap-12 py-20 lg:min-h-[640px] lg:grid-cols-2 lg:py-24">
        <div className="text-white">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-100">
            <span className="h-2 w-2 rounded-full bg-accent-300" />
            {t.home.heroBadge}
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t.home.heroTitle1}
            <span className="block text-gradient-blue">{t.home.heroTitle2}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-white/80">{t.home.heroSubtitle}</p>

          <div className="mt-9 max-w-2xl">
            <SearchBar availableWilayas={availableWilayas} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {available || "—"}
              </span>
              {t.home.availableLabel}
            </span>
            <span className="hidden h-8 w-px bg-white/25 sm:block" />
            <span>{t.home.noFees}</span>
          </div>
        </div>

        <div className="perspective hidden lg:block">
          <div
            data-hero-scene
            className="preserve-3d relative mx-auto h-[420px] w-[380px] transition-transform duration-200 ease-out will-change-transform"
          >
            <div
              className="glass-strong absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 rounded-3xl p-5 text-white shadow-float"
              style={{ transform: "translateZ(60px)" }}
            >
              <div className="h-36 w-full rounded-2xl bg-gradient-to-br from-brand-400/80 via-brand-600/70 to-accent-500/70" />
              <p className="mt-4 text-xs uppercase tracking-wide text-brand-100">
                {t.common.villa} · {t.home.atouts.seaside.title}
              </p>
              <p className="mt-1 font-display text-lg font-semibold">Villa Azur</p>
              <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                <span>6 {t.common.pers} · {t.common.pool}</span>
                <span className="font-bold text-white">
                  {formatPrice(25000, locale)} {t.common.perNight}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

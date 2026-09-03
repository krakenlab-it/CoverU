"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { HERO_SLIDES } from "@/lib/marketing-content";
import { MARKETING_ASSETS } from "@/lib/marketing-assets";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = HERO_SLIDES.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [goNext]);

  const slide = HERO_SLIDES[activeIndex];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#b8071f] from-[-20%] via-coveru-red to-white pb-8 pt-4 text-white shadow-inner md:pb-12 md:pt-6"
      aria-roledescription="carousel"
      aria-label="Presentación principal"
    >
      <div
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat opacity-30 md:block"
        style={{ backgroundImage: `url(${MARKETING_ASSETS.heroBackgroundDesktop})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 md:hidden"
        style={{ backgroundImage: `url(${MARKETING_ASSETS.heroBackgroundMobile})` }}
        aria-hidden
      />

      <div className="marketing-layout relative">
        <div
          className="grid items-center gap-6 md:grid-cols-[1fr_50%] md:gap-8"
          aria-live="polite"
        >
          <div className="order-2 flex justify-center md:order-1 md:justify-end">
            <div className="relative max-h-[28rem] w-full max-w-lg overflow-hidden">
              <Image
                key={slide.id}
                src={slide.image}
                alt={slide.imageAlt}
                width={760}
                height={756}
                priority={activeIndex === 0}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <div className="order-1 z-10 space-y-4 md:order-2 md:space-y-6 md:pr-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {slide.headline}
              {slide.highlight ? (
                <>
                  {" "}
                  <span className="text-white">{slide.highlight}</span>
                </>
              ) : null}
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              {slide.subheadline}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-coveru-red/70 text-white backdrop-blur transition-colors hover:bg-coveru-red"
          aria-label="Diapositiva anterior"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-coveru-red/70 text-white backdrop-blur transition-colors hover:bg-coveru-red"
          aria-label="Diapositiva siguiente"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  );
}

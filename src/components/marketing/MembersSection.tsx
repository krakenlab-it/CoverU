"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { MEMBER_LOGOS, TESTIMONIALS } from "@/lib/marketing-content";

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

export function MembersSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = TESTIMONIALS.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  useEffect(() => {
    const timer = window.setInterval(() => goTo(activeIndex + 1), 5000);
    return () => window.clearInterval(timer);
  }, [activeIndex, goTo]);

  const testimonial = TESTIMONIALS[activeIndex];

  return (
    <section className="py-12 md:py-16" aria-labelledby="members-heading">
      <div className="marketing-layout space-y-10">
        <div className="text-center">
          <h2 id="members-heading" className="marketing-h2">
            Somos Miembros
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {MEMBER_LOGOS.map((logo) => (
            <Image
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              width={120}
              height={48}
              className="h-10 w-auto object-contain opacity-80 grayscale transition-all hover:opacity-100 hover:grayscale-0 md:h-12"
            />
          ))}
        </div>

        <div
          className="relative mx-auto max-w-2xl"
          aria-roledescription="carousel"
          aria-label="Testimonios"
        >
          <article className="rounded-3xl border border-coveru-border bg-white p-6 shadow-lg shadow-black/5 md:p-8">
            <div className="flex items-center gap-4">
              <Image
                src={testimonial.image}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-coveru-gray">{testimonial.role}</p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-foreground/80 md:text-base">
              {testimonial.quote}
            </p>
          </article>

          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute -left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-coveru-border bg-white text-coveru-red shadow-md transition-colors hover:bg-coveru-light md:-left-14"
            aria-label="Testimonio anterior"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute -right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-coveru-border bg-white text-coveru-red shadow-md transition-colors hover:bg-coveru-light md:-right-14"
            aria-label="Testimonio siguiente"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

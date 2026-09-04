"use client";

import Image from "next/image";
import Link from "next/link";
import { VISUAL_PACK_MARKETING } from "@/lib/visual-pack/assets";

export function HeroCarousel() {
  return (
    <section
      className="relative overflow-hidden bg-[#FCFBF8] py-6 md:py-10"
      aria-label="Presentación principal"
    >
      <div className="marketing-layout">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-white shadow-sm">
          <Image
            src={VISUAL_PACK_MARKETING.heroCoveru}
            alt="Compara coberturas con claridad — experiencia Demo para ordenar opciones de seguros en Ecuador"
            width={1440}
            height={810}
            priority
            className="h-auto w-full object-contain"
          />

          <div className="sr-only">
            <h1>Compara coberturas con claridad.</h1>
            <p>
              Una experiencia Demo para ordenar opciones de seguros en Ecuador —
              sin ruido.
            </p>
            <Link href="/comparar">Explorar Demo</Link>
            <Link href="/login">Ver sistema</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { BENTO_CARDS } from "@/lib/marketing-content";

export function BentoGrid() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="bento-heading">
      <div className="marketing-layout space-y-10">
        <div className="text-center">
          <h2 id="bento-heading" className="marketing-h2">
            Encuentra tu seguro ideal en minutos y{" "}
            <span className="text-coveru-red">100% Online</span>
          </h2>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {BENTO_CARDS.map((card) => {
            const isPrimary = card.variant === "primary";

            return (
              <article
                key={card.id}
                className={[
                  "relative flex min-h-[18rem] flex-col overflow-hidden rounded-3xl",
                  card.id === "easy" || card.id === "vida"
                    ? "md:col-span-2"
                    : "md:col-span-1",
                  card.id === "colaboradores" ? "md:row-span-2 md:min-h-[24rem]" : "",
                  isPrimary ? "marketing-primary-card text-white" : "marketing-glass-card text-foreground",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="relative z-10 space-y-2 p-5 md:space-y-3 md:p-6">
                  <h3 className="text-xl font-bold md:text-2xl">{card.title}</h3>
                  <p className={`text-sm ${isPrimary ? "text-white/90" : "text-foreground/70"}`}>
                    {card.description}
                  </p>

                  {"cta" in card && card.cta ? (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href={card.cta.href}
                        className={`marketing-pill border-2 ${
                          isPrimary
                            ? "border-white bg-transparent text-white hover:bg-white/10"
                            : "border-coveru-red text-coveru-red hover:bg-coveru-red hover:text-white"
                        }`}
                      >
                        {card.cta.label}
                      </Link>
                      {"secondaryCta" in card && card.secondaryCta ? (
                        <Link
                          href={card.secondaryCta.href}
                          className={`marketing-pill ${
                            isPrimary
                              ? "bg-white/15 text-white hover:bg-white/25"
                              : "bg-white/80 text-foreground hover:bg-white"
                          }`}
                        >
                          {card.secondaryCta.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div
                  className={[
                    "relative mt-auto w-full",
                    card.id === "colaboradores"
                      ? "max-h-56 md:absolute md:bottom-0 md:max-h-none"
                      : "max-h-44 md:max-h-52",
                  ].join(" ")}
                >
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    width={600}
                    height={500}
                    className="h-full w-full object-contain object-bottom"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

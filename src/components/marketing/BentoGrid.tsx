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
                  "relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl",
                  isPrimary ? "marketing-primary-card text-white" : "marketing-glass-card text-foreground",
                ].join(" ")}
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
                    </div>
                  ) : null}
                </div>

                <div className="relative mt-auto w-full max-h-52 md:max-h-56">
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

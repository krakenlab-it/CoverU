import Image from "next/image";
import { HOW_IT_WORKS_STEPS } from "@/lib/marketing-content";

export function HowItWorks() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="how-it-works-heading">
      <div className="marketing-layout space-y-10">
        <div className="text-center">
          <h2 id="how-it-works-heading" className="marketing-h2">
            Cómo funciona <span className="text-coveru-red">Cover U</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.number}
              className="mx-auto flex max-w-lg flex-col items-center text-center"
            >
              <Image
                src={step.image}
                alt={step.imageAlt}
                width={390}
                height={256}
                className="h-auto w-full max-w-xs object-contain"
              />
              <div className="mt-4 flex items-start gap-3 text-left">
                <span className="text-2xl font-bold text-coveru-red">
                  {step.number}.
                </span>
                <p className="text-base text-foreground/80">
                  {step.text}
                  {"highlight" in step && step.highlight ? (
                    <>
                      {" "}
                      <span className="font-semibold text-coveru-red">
                        {step.highlight}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

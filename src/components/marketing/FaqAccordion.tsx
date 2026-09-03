"use client";

import { useId } from "react";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: readonly FaqItem[];
  numbered?: boolean;
  className?: string;
};

export function FaqAccordion({
  items,
  numbered = true,
  className = "",
}: FaqAccordionProps) {
  const groupId = useId();

  return (
    <div className={`w-full max-w-5xl ${className}`}>
      {items.map((item, index) => (
        <details
          key={item.question}
          name={groupId}
          className="group border-t border-coveru-border px-2 py-4 first:border-t md:px-4 md:py-5"
        >
          <summary className="flex cursor-pointer list-none items-start gap-2 text-base font-semibold text-foreground/80 marker:content-none md:text-xl [&::-webkit-details-marker]:hidden">
            {numbered ? <span className="shrink-0">{index + 1}.</span> : null}
            <span>{item.question}</span>
          </summary>
          <div className="pt-3 text-sm leading-relaxed text-coveru-gray md:pl-6 md:text-base">
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

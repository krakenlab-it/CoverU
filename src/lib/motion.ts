/** Shared motion class names that respect prefers-reduced-motion. */
export const motion = {
  fadeIn: "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
  slideUp:
    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200",
  panel:
    "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-out",
  cardHover:
    "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:hover:shadow-md",
  navLink:
    "motion-safe:transition-colors motion-safe:duration-150",
} as const;

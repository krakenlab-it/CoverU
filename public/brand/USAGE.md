# CoverÜ visual system

A dense, paper-and-ink insurance marketplace system for Ecuador. All sample product UI is explicitly **Demo**.

## Logo
- Use the wordmark when horizontal space is at least 160 px; retain clear space equal to the compact mark’s inner U width.
- Use the compact mark for favicons, app tiles, avatars, and UI rails. Do not redraw, rotate, outline, or place it on low-contrast imagery.
- Red-on-white is primary. Use white/red-on-dark on near-black surfaces. The 1-color black lockup is for constrained print.
- The spelling is always **CoverÜ** (capital C and Ü).

## UI system
Paper surfaces, near-black navigation, red selection signals, compact metadata, aligned comparison columns, and visible system states create an “insurance OS,” not a marketing page. Use the spacing and radius tokens; avoid oversized hero treatments in product UI.

## Accessibility
- `#DF0926` with white is suitable for large text and graphical controls; for small body text on white use `--coveru-red-700` or near-black.
- Default text uses `#17171A` on paper/white. Muted text is for secondary copy only.
- Never communicate state by color alone: pair red with labels, icons, or shape.
- Preserve SVG titles/ARIA labels in implementation and add contextual alt text. Decorative illustrations should use empty alt text.
- Maintain a visible focus ring using `--coveru-focus` and respect reduced-motion preferences for loading UI.

## Asset notes
SVG is the source of truth; PNGs are export renditions. Social copy and illustrations contain no insurer identities, prices, coverage promises, or statistics. State and illustration copy is Demo-only.

# Design Direction

## Product feel

The interface is a focused workbench for a mathematics tutor: calm enough for repeated daily use, warm enough to feel supportive, and structured enough to keep student work easy to scan. It should feel encouraging without looking like a children's game or a generic enterprise dashboard.

The tutor's next useful action should be easy to find. Group information by real tasks such as reviewing work, managing learners, organizing materials, and tracking classes. Use emphasis to clarify priority, not to decorate every panel.

## Source of truth

`src/components/Providers.tsx` (MUI theme: palette, shape, typography, component overrides, light/dark schemes) is authoritative for implemented colors, radii, and component styles. Change a visual token there; do not create a competing palette in feature code or documentation.

Color is applied per widget through the tone system in `src/components/tones.ts` (`primary`, `info`, `success`, `warning`, `secondary`, `error`). Pass `tone` and `icon` to `StatCard`, `PageSection`, `ItemRow`, and `LinkList` items instead of hardcoding colors; `toneAt(index)` cycles tones for repeated groups. Gradients, tinted fills, and colored shadows come from the helpers (`gradientOf`, `tint`, `glow`, `glass`), which resolve to theme CSS variables and follow dark mode. Keep concrete color values in the theme; this guide describes their purpose rather than duplicating them.

## Visual principles

- **Tutor-first hierarchy:** page title, current work, and a clear primary action lead; supporting statistics remain secondary.
- **Purposeful grouping:** panels and cards group related information. Avoid nesting framed surfaces or turning every item into a card.
- **Subject-aware color:** each widget carries a tone (stat cards, section headers, row icons, status chips) so categories are recognizable at a glance; gradients and colored shadows give depth. Status foregrounds use matching surfaces and remain understandable without color alone.
- **Readable data:** names, class/grade, subject, due date, and progress should remain scannable. Keep metadata quieter, not faint.
- **Friendly, not childish:** use concise Ukrainian labels and familiar mathematics context. Avoid decorative math symbols when they do not communicate meaning.
- **Quiet interaction:** hover, focus, disabled, loading, empty, and error states should be distinct. Keep keyboard focus visible and controls understandable without color alone.

## Layout and responsive behavior

The desktop application uses a persistent drawer with a constrained content area, a gradient page header, summary metrics, and grouped work panels. On tablet and phone, the drawer becomes temporary and content reflows into a single column. All routes remain available at narrow widths.

## Typography and content

The application UI is Ukrainian. Use short, direct labels; name actions by their result (for example, adding a student or opening materials). Keep headings in sentence case. Typography is defined in the MUI theme (Roboto); do not introduce external font requests or per-page font overrides casually.

## Reusable patterns

- Compose pages from MUI and the shared components in `src/components/`; extend the theme in `Providers.tsx` rather than duplicating one-off `sx` rules.
- Keep primary actions visually distinct from secondary actions, and use icon-only controls only when they have an accessible name.
- Place feedback near the action or content it describes. Empty states should tell the tutor what is missing and, where appropriate, offer the next action.
- Check long names, translated labels, keyboard operation, focus visibility, and layouts at 390px phone, 768px tablet, and desktop widths. Avoid horizontal page overflow; horizontal scrolling is reserved for labeled navigation and the accessible chart/table container.

## Skill routing

- Use `.github/skills/frontend-design/SKILL.md` for a new visual concept or substantial page redesign.
- Use `.github/skills/ui-ux-pro-max/SKILL.md` for one focused question about accessibility, interaction, forms, navigation, or responsive behavior.
- Routine page and component work follows this guide and the existing theme; do not generate a separate design system unless explicitly requested.

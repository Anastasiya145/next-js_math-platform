# Design Direction

## Product feel

The interface is a focused workbench for a mathematics tutor: calm enough for repeated daily use, warm enough to feel supportive, and structured enough to keep student work easy to scan. It should feel encouraging without looking like a children's game or a generic enterprise dashboard.

The tutor's next useful action should be easy to find. Group information by real tasks such as reviewing work, managing learners, organizing materials, and tracking classes. Use emphasis to clarify priority, not to decorate every panel.

## Source of truth

`src/app/globals.css` is authoritative for implemented colors, typography, spacing, radii, and component styles. Update the stylesheet when a visual token changes; do not create a competing palette in feature code or documentation.

The stylesheet defines semantic roles for the light canvas and surfaces, forest-green actions and focus, readable ink and muted text, paired status colors, and blue/peach/lilac subject accents. Keep concrete color values in `globals.css`; this guide describes their purpose rather than duplicating them. The stylesheet currently mixes Georgia body text and Arial utility text while the layout also loads Geist; preserve the rendered result unless typography is intentionally reviewed and consolidated.

## Visual principles

- **Tutor-first hierarchy:** page title, current work, and a clear primary action lead; supporting statistics remain secondary.
- **Purposeful grouping:** panels and cards group related information. Avoid nesting framed surfaces or turning every item into a card.
- **Subject-aware color:** green is the main action and focus color; softer green, peach, blue, and lilac accents distinguish categories. Status foregrounds use matching surfaces and remain understandable without color alone.
- **Readable data:** names, class/grade, subject, due date, and progress should remain scannable. Keep metadata quieter, not faint.
- **Friendly, not childish:** use concise Ukrainian labels and familiar mathematics context. Avoid decorative math symbols when they do not communicate meaning.
- **Quiet interaction:** hover, focus, disabled, loading, empty, and error states should be distinct. Keep keyboard focus visible and controls understandable without color alone.

## Layout and responsive behavior

The desktop application uses a persistent sidebar with a constrained content area, summary metrics, and grouped work panels. On tablet, keep the sidebar and collapse dense data grids before they become cramped. On phones, the sidebar becomes a compact header with horizontally scrollable labeled navigation; page content and forms reflow into a single column. All routes remain available at narrow widths.

## Typography and content

The application UI is Ukrainian. Use short, direct labels; name actions by their result (for example, adding a student or opening materials). Keep headings in sentence case. Preserve the established font treatment unless the user asks for a typography change; do not introduce external font requests or per-page font overrides casually.

## Reusable patterns

- Reuse the existing shell and class names where they express the same role; extend shared styles in `globals.css` rather than duplicating one-off visual rules.
- Keep primary actions visually distinct from secondary actions, and use icon-only controls only when they have an accessible name.
- Place feedback near the action or content it describes. Empty states should tell the tutor what is missing and, where appropriate, offer the next action.
- Check long names, translated labels, keyboard operation, focus visibility, and layouts at 390px phone, 768px tablet, and desktop widths. Avoid horizontal page overflow; horizontal scrolling is reserved for labeled navigation and the accessible chart/table container.

## Skill routing

- Use `.github/skills/frontend-design/SKILL.md` for a new visual concept or substantial page redesign.
- Use `.github/skills/ui-ux-pro-max/SKILL.md` for one focused question about accessibility, interaction, forms, navigation, or responsive behavior.
- Routine page and component work follows this guide and the existing CSS; do not generate a separate design system unless explicitly requested.

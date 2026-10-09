---
description: "Use when creating or changing application pages, layouts, forms, navigation, or visual components."
applyTo: "src/app/**/*.{ts,tsx}"
---

# Application UI

- Read `DESIGN.md` and the MUI theme in `src/components/Providers.tsx` before making visual changes.
- Reuse the shared components in `src/components/` and the tone helpers in `src/components/tones.ts`. Keep shared visual changes in the theme instead of accumulating page-specific values.
- Preserve the Ukrainian end-user language and established visual hierarchy across desktop, tablet, and phone layouts.
- Every form control needs a visible label. Icon-only controls need an accessible name; interactive states must work by keyboard and show focus.
- Keep loading, empty, success, and error feedback clear and close to the affected content or action.
- Check actual layouts at 390px phone, 768px tablet, and desktop widths. Ensure no horizontal page overflow and keep all primary actions, labels, and focus states available after reflow.
- Do not treat static dashboard figures or navigation links as evidence that a workflow is implemented; verify the relevant route and data flow.

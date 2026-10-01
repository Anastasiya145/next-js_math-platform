---
description: "Use when creating or changing application pages, layouts, forms, navigation, or visual components."
applyTo: "src/app/**/*.{ts,tsx}"
---

# Application UI

- Read `DESIGN.md` and the relevant selectors in `src/app/globals.css` before making visual changes.
- Reuse the current page shell and CSS patterns where appropriate. Keep shared visual changes in `globals.css` instead of accumulating page-specific values.
- Preserve the Ukrainian end-user language and established visual hierarchy across desktop, tablet, and phone layouts.
- Every form control needs a visible label. Icon-only controls need an accessible name; interactive states must work by keyboard and show focus.
- Keep loading, empty, success, and error feedback clear and close to the affected content or action.
- Check actual layouts at 390px phone, 768px tablet, and desktop widths. Ensure no horizontal page overflow and keep all primary actions, labels, and focus states available after reflow.
- Do not treat static dashboard figures or navigation links as evidence that a workflow is implemented; verify the relevant route and data flow.

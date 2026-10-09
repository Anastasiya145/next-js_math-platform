// Palette tones resolve to theme CSS variables, so these helpers are safe in server components and follow light/dark schemes.
export type Tone = "primary" | "secondary" | "success" | "warning" | "info" | "error";

type Shade = "main" | "light" | "dark" | "contrastText";

const CYCLE: Tone[] = ["primary", "info", "success", "warning", "secondary"];

export const toneAt = (index: number): Tone => CYCLE[Math.abs(index) % CYCLE.length];

export const shade = (tone: Tone, name: Shade = "main") => `var(--mui-palette-${tone}-${name})`;

export const tint = (tone: Tone, percent: number) =>
  `color-mix(in srgb, ${shade(tone)} ${percent}%, transparent)`;

// Translucent white used for glass shapes on top of gradient surfaces.
export const glass = (percent: number) =>
  `color-mix(in srgb, var(--mui-palette-common-white) ${percent}%, transparent)`;

export const gradientOf = (tone: Tone) =>
  `linear-gradient(135deg, ${shade(tone)}, ${shade(tone, "dark")})`;

export const glow = (tone: Tone, strength = 60) => `0 14px 28px -14px ${tint(tone, strength)}`;

"use client";

import { Box, Stack } from "@mui/material";
import { siteVariant } from "@/lib/site-variant";
import { gradientOf, glow, type Tone } from "./tones";

const GLYPHS: Record<typeof siteVariant, string[]> = {
  math: ["π", "√", "∑"],
  languages: ["А", "É", "Я"],
};
const TONES: Tone[] = ["primary", "secondary", "info"];

// Playful loader: three tiles hop in turn (motion is disabled for reduced-motion users by the theme).
export function Loader({ label, size = 36 }: { label: string; size?: number }) {
  return (
    <Stack
      role="progressbar"
      aria-label={label}
      direction="row"
      spacing={1.25}
      sx={{
        justifyContent: "center",
        alignItems: "flex-end",
        py: 3,
        height: size * 2.2,
      }}
    >
      {GLYPHS[siteVariant].map((glyph, index) => (
        <Box
          key={glyph}
          aria-hidden
          sx={{
            width: size,
            height: size,
            borderRadius: "30%",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: size * 0.5,
            color: "var(--mui-palette-common-white)",
            background: gradientOf(TONES[index]),
            boxShadow: glow(TONES[index], 70),
            animation: "loaderHop 1.1s cubic-bezier(.3,.7,.4,1) infinite",
            animationDelay: `${index * 0.14}s`,
          }}
        >
          {glyph}
        </Box>
      ))}
    </Stack>
  );
}

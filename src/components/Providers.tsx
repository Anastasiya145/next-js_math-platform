"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { gradientOf, tint, type Tone } from "./tones";

type Swatch = [light: string, main: string, dark: string];

const tones = (palette: Record<Tone, Swatch>) =>
  Object.fromEntries(
    Object.entries(palette).map(([tone, [light, main, dark]]) => [
      tone,
      { light, main, dark, contrastText: "#fff" },
    ]),
  ) as Record<Tone, { light: string; main: string; dark: string; contrastText: string }>;

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "media" },
  colorSchemes: {
    light: {
      palette: {
        ...tones({
          primary: ["#8B8FFF", "#5B5FEF", "#3C3FB8"],
          secondary: ["#F472B6", "#DB2777", "#9D174D"],
          success: ["#34D399", "#059669", "#065F46"],
          warning: ["#FBBF24", "#D97706", "#92400E"],
          info: ["#38BDF8", "#0284C7", "#075985"],
          error: ["#F87171", "#DC2626", "#991B1B"],
        }),
        background: { default: "#F3F4FF", paper: "#FFFFFF" },
        text: { primary: "#1B1B3A", secondary: "#55557A" },
      },
    },
    dark: {
      palette: {
        ...tones({
          primary: ["#A5A8FF", "#6C70F5", "#4347C9"],
          secondary: ["#F9A8D4", "#E0408D", "#A3185F"],
          success: ["#6EE7B7", "#0EA574", "#066A4B"],
          warning: ["#FCD34D", "#D97706", "#92400E"],
          info: ["#7DD3FC", "#0A8FD0", "#065A87"],
          error: ["#FCA5A5", "#E5484D", "#A12327"],
        }),
        background: { default: "#0E0F24", paper: "#181A3D" },
      },
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, sans-serif",
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundAttachment: "fixed",
          backgroundImage: [
            `radial-gradient(900px 520px at 100% -8%, ${tint("primary", 16)}, transparent 70%)`,
            `radial-gradient(760px 520px at -8% 108%, ${tint("secondary", 11)}, transparent 70%)`,
          ].join(","),
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12 },
        contained: ({ ownerState }) => {
          const tone = (ownerState.color ?? "primary") as Tone | "inherit";
          if (tone === "inherit") return {};
          return {
            background: gradientOf(tone),
            boxShadow: `0 8px 18px -8px ${tint(tone, 75)}`,
            transition: "box-shadow 0.2s, transform 0.2s, filter 0.2s",
            "&:hover": {
              background: gradientOf(tone),
              filter: "brightness(1.08)",
              boxShadow: `0 12px 22px -8px ${tint(tone, 85)}`,
              transform: "translateY(-1px)",
            },
            "&.Mui-disabled": {
              background: "var(--mui-palette-action-disabledBackground)",
              boxShadow: "none",
            },
          };
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${tint("primary", 12)}`,
          boxShadow: `0 1px 2px ${tint("primary", 8)}, 0 18px 34px -22px ${tint("primary", 55)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        filled: ({ ownerState }) =>
          ownerState.color && ownerState.color !== "default"
            ? { background: gradientOf(ownerState.color as Tone) }
            : {},
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 4, borderRadius: 4, background: gradientOf("primary") },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          "&.Mui-selected, &.Mui-selected:hover": {
            color: "var(--mui-palette-primary-contrastText)",
            background: gradientOf("primary"),
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${tint("primary", 14)}`,
          boxShadow: "none",
          transition: "box-shadow 0.2s, border-color 0.2s",
          "&::before": { display: "none" },
          "&.Mui-expanded": {
            borderColor: tint("primary", 35),
            boxShadow: `0 14px 26px -18px ${tint("primary", 60)}`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          backgroundImage: `linear-gradient(180deg, ${tint("primary", 12)}, transparent 160px)`,
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { "&.Mui-focused": { boxShadow: `0 0 0 4px ${tint("primary", 16)}` } },
      },
    },
  },
});

export function Providers({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider session={session}>{children}</SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

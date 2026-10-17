"use client";

import { Box, Stack, Typography, type StackProps } from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import TranslateIcon from "@mui/icons-material/Translate";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { translate, type TranslationKey } from "@/lib/language-messages";
import type { AppLocale } from "@/lib/languages";
import { siteVariant } from "@/lib/site-variant";
import { glass, glow, gradientOf } from "./tones";

type Props = {
  size?: "hero" | "compact" | "header";
  locale?: AppLocale;
  sx?: StackProps["sx"];
};

export function SiteLogo({ size = "compact", locale, sx }: Props) {
  const { t: contextT } = useAppLanguage();
  const t = (key: TranslationKey) =>
    locale ? translate(locale, key) : contextT(key);
  const hero = size === "hero";
  const BrandIcon = siteVariant === "languages" ? TranslateIcon : FunctionsIcon;
  const dimension = hero ? 96 : size === "compact" ? 44 : 38;

  return (
    <Stack
      direction="row"
      spacing={hero ? 2.5 : 1.5}
      sx={{ alignItems: "center", ...sx }}
    >
      <Box
        aria-hidden
        sx={{
          display: "grid",
          placeItems: "center",
          width: dimension,
          height: dimension,
          flexShrink: 0,
          borderRadius: hero ? "28px" : size === "compact" ? "14px" : "12px",
          color: "primary.contrastText",
          background: hero ? glass(22) : gradientOf("primary"),
          boxShadow: glow(hero ? "secondary" : "primary", hero ? 80 : 70),
          ...(hero && { backdropFilter: "blur(6px)" }),
        }}
      >
        <BrandIcon
          sx={{ fontSize: hero ? 56 : size === "compact" ? 24 : 22 }}
        />
      </Box>
      <Typography
        variant={hero ? "h4" : "h6"}
        component={hero || size === "compact" ? "p" : "span"}
        noWrap={size === "header"}
        sx={{
          fontWeight: 700,
          ...(size === "header" && {
            flexGrow: 1,
            minWidth: 0,
            fontSize: { xs: "0.95rem", sm: "1.25rem" },
          }),
        }}
      >
        {siteVariant === "languages" ? (
          t("languageBrand")
        ) : hero ? (
          <>
            Математика
            <br />з Анастасією
          </>
        ) : (
          t("mathBrand")
        )}
      </Typography>
    </Stack>
  );
}

import type { ReactNode } from "react";
import { Avatar, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { glass, glow, gradientOf, shade, type Tone } from "./tones";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
};

// Gradient metric tile; the colour tone identifies the metric across pages.
export function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        border: 0,
        color: shade(tone, "contrastText"),
        background: gradientOf(tone),
        boxShadow: glow(tone, 75),
        "&::before, &::after": { content: '""', position: "absolute", borderRadius: "50%" },
        "&::before": { width: 150, height: 150, top: -60, right: -40, background: glass(16) },
        "&::after": { width: 90, height: 90, bottom: -40, right: 50, background: glass(10) },
      }}
    >
      <CardContent sx={{ position: "relative" }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 500, opacity: 0.92 }}>{label}</Typography>
            <Typography variant="h3" component="p" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Avatar
              variant="rounded"
              sx={{ width: 48, height: 48, color: "inherit", bgcolor: glass(22) }}
            >
              {icon}
            </Avatar>
          )}
        </Stack>
        {hint && (
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.88 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

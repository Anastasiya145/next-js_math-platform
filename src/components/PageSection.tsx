import type { ReactNode } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
} from "@mui/material";
import { glow, gradientOf, shade, tint, type Tone } from "./tones";

type PageSectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  flat?: boolean;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children?: ReactNode;
};

// Card with a tinted header plus the shared loading / error / empty states.
export function PageSection({
  title,
  subtitle,
  action,
  icon,
  tone = "primary",
  flat,
  loading,
  error,
  empty,
  emptyText,
  children,
}: PageSectionProps) {
  return (
    <Card
      component="section"
      aria-busy={loading}
      sx={{
        overflow: "hidden",
        ...(flat && { border: 0, boxShadow: "none", bgcolor: "transparent" }),
      }}
    >
      <CardHeader
        title={title}
        subheader={subtitle}
        action={action}
        avatar={
          icon && (
            <Avatar
              variant="rounded"
              sx={{
                color: shade(tone, "contrastText"),
                background: gradientOf(tone),
                boxShadow: glow(tone, 70),
                fontWeight: 700,
              }}
            >
              {icon}
            </Avatar>
          )
        }
        slotProps={{ title: { variant: "h6", component: "h2" } }}
        sx={{ mb: 2, background: `linear-gradient(90deg, ${tint(tone, 14)}, transparent 75%)` }}
      />
      <CardContent sx={{ pt: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CircularProgress aria-label="Завантаження" color={tone} />
          </Box>
        ) : empty && !error ? (
          <Typography color="text.secondary">{emptyText}</Typography>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

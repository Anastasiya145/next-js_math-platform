import type { ReactNode } from "react";
import {
  Avatar,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  type IconButtonProps,
} from "@mui/material";
import { shade, tint, type Tone } from "./tones";

type ItemRowProps = {
  icon: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  actions?: ReactNode;
  tone?: Tone;
};

// A string icon (grade number, initial) renders as bold text inside the tile.
export function ItemRow({ icon, primary, secondary, actions, tone = "primary" }: ItemRowProps) {
  return (
    <ListItem
      divider
      sx={{
        gap: 1,
        px: 1,
        borderRadius: "12px",
        borderColor: tint(tone, 14),
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: tint(tone, 7) },
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <ListItemAvatar>
        <Avatar
          variant="rounded"
          sx={{ bgcolor: tint(tone, 16), color: shade(tone), fontWeight: 700 }}
        >
          {icon}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={primary}
        secondary={secondary}
        slotProps={{ primary: { sx: { fontWeight: 500 } } }}
        sx={{ minWidth: 0, wordBreak: "break-word" }}
      />
      {actions}
    </ListItem>
  );
}

// Icon button with a tooltip and an accessible label; pass `component`/`href` for links.
export function IconAction({
  label,
  color = "primary",
  children,
  ...props
}: IconButtonProps & { label: string; href?: string; target?: string; rel?: string }) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} color={color} {...props}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

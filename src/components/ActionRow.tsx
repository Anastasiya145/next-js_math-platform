import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";

// Places an action (e.g. DeleteAction) beside a block such as an Accordion, outside its clickable header.
export function ActionRow({ action, children }: { action: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <Box sx={{ pt: 1 }}>{action}</Box>
    </Stack>
  );
}

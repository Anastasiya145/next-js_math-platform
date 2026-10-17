"use client";

import { TextField, type TextFieldProps } from "@mui/material";

type Props = Omit<TextFieldProps, "type" | "slotProps">;

export function DateField(props: Props) {
  return (
    <TextField
      {...props}
      type="date"
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}

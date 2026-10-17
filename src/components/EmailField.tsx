"use client";

import { TextField, type TextFieldProps } from "@mui/material";
import { MAX_EMAIL_LENGTH } from "@/lib/validation";

type Props = Omit<TextFieldProps, "type" | "slotProps"> & {
  maxLength?: number;
};

export function EmailField({ maxLength = MAX_EMAIL_LENGTH, ...props }: Props) {
  return (
    <TextField
      {...props}
      type="email"
      slotProps={{ htmlInput: { maxLength } }}
    />
  );
}

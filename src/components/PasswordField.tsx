"use client";

import { useState } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  type TextFieldProps,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffOutlined";
import { translate } from "@/lib/language-messages";
import type { AppLocale } from "@/lib/languages";

type Props = Omit<TextFieldProps, "type"> & { locale: AppLocale };

export function PasswordField({ locale, slotProps, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = translate(
    locale,
    visible ? "hidePassword" : "showPassword",
  );

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={toggleLabel}>
                <IconButton
                  type="button"
                  edge="end"
                  aria-label={toggleLabel}
                  onClick={() => setVisible((current) => !current)}
                >
                  {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

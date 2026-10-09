"use client";

import { useState } from "react";
import { TextField } from "@mui/material";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { router } from "@/app/router";
import { validatePassword } from "@/lib/validation";
import { FormDialog } from "./FormDialog";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordError = password ? validatePassword(password) : null;
  const mismatch = Boolean(confirm) && confirm !== password;

  return (
    <FormDialog
      title="Змінити пароль"
      submitLabel="Змінити"
      submitDisabled={!password || Boolean(passwordError) || confirm !== password}
      onClose={onClose}
      onSubmit={() =>
        api(router.api.changePassword, {
          body: { newPassword: password, confirmPassword: confirm },
          fallback: errorMessages.auth.passwordChangeFailed,
        })
      }
    >
      <TextField
        type="password"
        label="Новий пароль"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={Boolean(passwordError)}
        helperText={passwordError}
      />
      <TextField
        type="password"
        label="Підтвердіть пароль"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch}
        helperText={mismatch ? errorMessages.students.passwordsMismatch : undefined}
      />
    </FormDialog>
  );
}

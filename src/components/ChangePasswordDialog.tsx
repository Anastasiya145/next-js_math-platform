"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { router } from "@/app/router";
import { validatePassword } from "@/lib/validation";
import { FormDialog } from "./FormDialog";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { translateError } from "@/lib/language-messages";
import { PasswordField } from "./PasswordField";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { locale, t } = useAppLanguage();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordError = password ? validatePassword(password) : null;
  const mismatch = Boolean(confirm) && confirm !== password;

  return (
    <FormDialog
      title={t("passwordTitle")}
      submitLabel={t("savePassword")}
      submitDisabled={
        !current || !password || Boolean(passwordError) || confirm !== password
      }
      onClose={onClose}
      onSubmit={() =>
        api(router.api.changePassword, {
          body: {
            currentPassword: current,
            newPassword: password,
            confirmPassword: confirm,
          },
          fallback: errorMessages.auth.passwordChangeFailed,
          locale,
        })
      }
    >
      <PasswordField
        locale={locale}
        label={t("currentPassword")}
        autoComplete="current-password"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
      />
      <PasswordField
        locale={locale}
        label={t("newPassword")}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={Boolean(passwordError)}
        helperText={
          passwordError ? translateError(passwordError, locale) : undefined
        }
      />
      <PasswordField
        locale={locale}
        label={t("confirmPassword")}
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        error={mismatch}
        helperText={
          mismatch
            ? translateError(errorMessages.students.passwordsMismatch, locale)
            : undefined
        }
      />
    </FormDialog>
  );
}

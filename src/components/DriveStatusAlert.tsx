"use client";

import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alert, Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { router } from "@/app/router";

// Warns the teacher before students hit an upload error; hidden while Drive works or the check fails.
export function DriveStatusAlert() {
  const pathname = usePathname();
  const { data } = useApi<{ connected: boolean }>(
    router.api.driveStatus,
    errorMessages.drive.statusFailed,
  );

  if (data?.connected !== false) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={<GoogleIcon />}
          onClick={() => signIn("google", { redirectTo: pathname })}
        >
          Підключити
        </Button>
      }
    >
      Google Drive не підключено: учні не зможуть надсилати роботи.
    </Alert>
  );
}

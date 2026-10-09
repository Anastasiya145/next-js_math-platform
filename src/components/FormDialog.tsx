"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { errorText } from "@/lib/api";

type FormDialogProps = {
  title: string;
  submitLabel: string;
  submitDisabled?: boolean;
  // Throw (e.g. from api()) to keep the dialog open and show the error.
  onSubmit: () => Promise<unknown>;
  onClose: () => void;
  children: ReactNode;
};

// Mount conditionally ({open && <FormDialog />}) so field state resets between uses.
export function FormDialog({
  title,
  submitLabel,
  submitDisabled,
  onSubmit,
  onClose,
  children,
}: FormDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={busy ? undefined : onClose}
      slotProps={{ paper: { component: "form", onSubmit: handleSubmit } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {children}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={busy}>
          Скасувати
        </Button>
        <Button type="submit" variant="contained" disabled={busy || submitDisabled}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

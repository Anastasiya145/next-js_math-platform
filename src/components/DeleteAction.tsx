"use client";

import { useState, type ReactNode } from "react";
import { Typography, type IconButtonProps } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { FormDialog } from "./FormDialog";
import { IconAction } from "./ItemRow";

type DeleteActionProps = {
  label: string;
  message: ReactNode;
  // Throw (e.g. from api()) to keep the dialog open and show the error.
  onConfirm: () => Promise<unknown>;
  sx?: IconButtonProps["sx"];
};

// Delete icon button that asks for confirmation before running `onConfirm`.
export function DeleteAction({ label, message, onConfirm, sx }: DeleteActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconAction label={label} color="error" sx={sx} onClick={() => setOpen(true)}>
        <DeleteIcon />
      </IconAction>
      {open && (
        <FormDialog
          title="Видалити?"
          submitLabel="Видалити"
          onSubmit={onConfirm}
          onClose={() => setOpen(false)}
        >
          <Typography>{message} Цю дію неможливо скасувати.</Typography>
        </FormDialog>
      )}
    </>
  );
}

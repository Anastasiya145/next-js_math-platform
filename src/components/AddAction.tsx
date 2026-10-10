"use client";

import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { FieldsDialog, type FieldsDialogProps } from "./FieldsDialog";

type AddActionProps = Omit<FieldsDialogProps, "title" | "onClose"> & {
  label: string;
  title?: string;
  icon?: ReactNode;
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
};

// Button that opens a spec-driven FieldsDialog.
export function AddAction({
  label,
  title = label,
  icon = <AddIcon />,
  variant = "contained",
  color,
  size,
  ...dialog
}: AddActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        startIcon={icon}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open && <FieldsDialog title={title} {...dialog} onClose={() => setOpen(false)} />}
    </>
  );
}

"use client";

import { useState } from "react";
import EditIcon from "@mui/icons-material/EditOutlined";
import { FieldsDialog, type FieldsDialogProps } from "./FieldsDialog";
import { IconAction } from "./ItemRow";

type EditActionProps = Omit<FieldsDialogProps, "title" | "onClose"> & {
  label: string;
  title?: string;
};

// Edit icon button that reopens a FieldsDialog; prefill it through each field's `defaultValue`.
export function EditAction({
  label,
  title = label,
  submitLabel = "Зберегти",
  ...dialog
}: EditActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconAction label={label} color="warning" onClick={() => setOpen(true)}>
        <EditIcon />
      </IconAction>
      {open && (
        <FieldsDialog
          title={title}
          submitLabel={submitLabel}
          {...dialog}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { MenuItem, TextField } from "@mui/material";
import { errorMessages } from "@/lib/error-messages";
import { FormDialog } from "./FormDialog";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "url" | "date" | "datetime-local" | "select" | "multiline";
  options?: Array<[value: string, label: string]>;
  defaultValue?: string;
  optional?: boolean;
  maxLength?: number;
};

export type FieldsDialogProps = {
  title: string;
  fields: FieldSpec[];
  submitLabel?: string;
  // Custom inputs rendered after the fields; `extraValid` gates submit.
  extra?: ReactNode;
  extraValid?: boolean;
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
  onClose: () => void;
};

const isHttpUrl = (value: string) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Spec-driven form dialog: describe the fields, get validation and submit handling.
export function FieldsDialog({
  title,
  fields,
  submitLabel = "Додати",
  extra,
  extraValid = true,
  onSubmit,
  onClose,
}: FieldsDialogProps) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((field) => [field.name, field.defaultValue ?? field.options?.[0]?.[0] ?? ""]),
    ),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errorFor = (field: FieldSpec) => {
    const value = values[field.name].trim();
    if (!value) return field.optional ? null : "";
    return field.type === "url" && !isHttpUrl(value) ? errorMessages.common.invalidUrl : null;
  };

  return (
    <FormDialog
      title={title}
      submitLabel={submitLabel}
      submitDisabled={!extraValid || fields.some((field) => errorFor(field) !== null)}
      onClose={onClose}
      onSubmit={() =>
        onSubmit(
          Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])),
        )
      }
    >
      {fields.map((field) => {
        const error = touched[field.name] ? errorFor(field) : null;
        return (
          <TextField
            key={field.name}
            label={field.label}
            required={!field.optional}
            select={field.type === "select"}
            multiline={field.type === "multiline"}
            minRows={field.type === "multiline" ? 3 : undefined}
            type={
              field.type === "url" || field.type === "date" || field.type === "datetime-local"
                ? field.type
                : undefined
            }
            value={values[field.name]}
            onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
            onBlur={() => setTouched({ ...touched, [field.name]: true })}
            error={Boolean(error)}
            helperText={error}
            slotProps={{
              htmlInput: { maxLength: field.maxLength },
              inputLabel:
                field.type === "date" || field.type === "datetime-local"
                  ? { shrink: true }
                  : undefined,
            }}
          >
            {field.options?.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        );
      })}
      {extra}
    </FormDialog>
  );
}

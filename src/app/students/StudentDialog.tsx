"use client";

import { useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import { api } from "@/lib/api";
import { GRADES } from "@/lib/format";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { router } from "@/app/router";
import { FormDialog } from "@/components/FormDialog";
import type { Student } from "./types";

type StudentDialogProps = {
  student?: Student;
  onSaved: () => Promise<unknown>;
  onClose: () => void;
};

// Creates a student account, or edits one when `student` is given.
export function StudentDialog({ student, onSaved, onClose }: StudentDialogProps) {
  const [values, setValues] = useState({
    name: student?.name ?? "",
    grade: String(student?.grade ?? 4),
    email: student?.email ?? "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    name: values.name.trim() ? null : errorMessages.students.nameRequired,
    email: validateEmail(values.email, !student),
    password:
      validatePassword(values.password, !student) ??
      (student && !student.email && values.email.trim() && !values.password
        ? errorMessages.students.newAccountPasswordRequired
        : null),
  };

  const field = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      setValues({ ...values, [key]: event.target.value }),
    onBlur: () => setTouched({ ...touched, [key]: true }),
    ...(key in errors && {
      error: Boolean(touched[key] && errors[key as keyof typeof errors]),
      helperText: touched[key] ? errors[key as keyof typeof errors] : undefined,
    }),
  });

  return (
    <FormDialog
      title={student ? "Редагувати учня" : "Новий учень"}
      submitLabel={student ? "Зберегти" : "Додати"}
      submitDisabled={Object.values(errors).some(Boolean)}
      onClose={onClose}
      onSubmit={async () => {
        await api(student ? router.api.student(student.id) : router.api.students, {
          method: student ? "PATCH" : "POST",
          body: {
            name: values.name.trim(),
            grade: Number(values.grade),
            email: values.email.trim().toLowerCase(),
            temporaryPassword: values.password,
          },
          fallback: student ? errorMessages.students.saveFailed : errorMessages.students.addFailed,
        });
        await onSaved();
      }}
    >
      <TextField
        label="Ім'я учня"
        autoComplete="name"
        slotProps={{ htmlInput: { maxLength: 120 } }}
        {...field("name")}
      />
      <TextField select label="Клас" {...field("grade")}>
        {GRADES.map((grade) => (
          <MenuItem key={grade} value={String(grade)}>
            {grade} клас
          </MenuItem>
        ))}
      </TextField>
      <TextField
        type="email"
        label="Email учня"
        autoComplete="off"
        slotProps={{ htmlInput: { maxLength: MAX_EMAIL_LENGTH } }}
        {...field("email")}
      />
      <TextField
        type="password"
        label="Тимчасовий пароль"
        autoComplete="new-password"
        slotProps={{ htmlInput: { maxLength: MAX_PASSWORD_LENGTH } }}
        {...field("password")}
        helperText={
          touched.password && errors.password
            ? errors.password
            : student
              ? `Залиште порожнім, щоб не змінювати. Новий: від ${MIN_PASSWORD_LENGTH} символів.`
              : `Від ${MIN_PASSWORD_LENGTH} до ${MAX_PASSWORD_LENGTH} символів. Передайте учню окремо.`
        }
      />
    </FormDialog>
  );
}

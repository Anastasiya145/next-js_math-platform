"use client";

import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { FieldsDialog } from "@/components/FieldsDialog";
import { router } from "../router";
import type { HomeworkStudentOption } from "./types";

type Props = {
  students: HomeworkStudentOption[];
  onCreated: () => Promise<void>;
  onClose: () => void;
};

export function HomeworkForm({ students, onCreated, onClose }: Props) {
  const [selected, setSelected] = useState<HomeworkStudentOption[]>([]);

  return (
    <FieldsDialog
      title="Призначити домашню роботу"
      submitLabel="Призначити"
      fields={[
        { name: "title", label: "Назва", maxLength: 160 },
        { name: "nextLessonAt", label: "Дата й час наступного уроку", type: "datetime-local" },
        { name: "resourceUrl", label: "Посилання на матеріал", type: "url", optional: true },
        { name: "instructions", label: "Інструкція", type: "multiline", optional: true },
      ]}
      extra={
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={students}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          getOptionLabel={(student) => `${student.name} · ${student.grade} клас`}
          renderInput={(params) => (
            <TextField {...params} label="Кому призначити" required={selected.length === 0} />
          )}
        />
      }
      extraValid={selected.length > 0}
      onClose={onClose}
      onSubmit={async (values) => {
        await api(router.api.assignments, {
          body: {
            ...values,
            nextLessonAt: new Date(values.nextLessonAt).toISOString(),
            dueAt: null,
            studentIds: selected.map((student) => student.id),
          },
          fallback: errorMessages.homework.createFailed,
        });
        await onCreated();
      }}
    />
  );
}

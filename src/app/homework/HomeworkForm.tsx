"use client";

import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { kyivLocalToIso } from "@/lib/format";
import { FieldsDialog } from "@/components/FieldsDialog";
import { router } from "../router";
import { LessonPicker, type LessonChoice } from "./LessonPicker";
import type { HomeworkStudentOption, TeacherHomework } from "./types";

type Props = {
  students: HomeworkStudentOption[];
  // Pass an existing assignment to edit it instead of creating a new one.
  homework?: TeacherHomework;
  // Starts a new assignment from an existing material; the lesson date is then optional.
  prefill?: { title: string; resourceUrl: string };
  onSaved: () => Promise<void>;
  onClose: () => void;
};

export function HomeworkForm({ students, homework, prefill, onSaved, onClose }: Props) {
  const [selected, setSelected] = useState<HomeworkStudentOption[]>(() =>
    (homework?.students ?? []).map(
      (student) =>
        students.find((option) => option.id === student.id) ?? { ...student, email: null },
    ),
  );
  const [lesson, setLesson] = useState<LessonChoice>({
    lessonAt: homework?.nextLessonAt ? new Date(homework.nextLessonAt).toISOString() : "",
    custom: false,
    customLocal: "",
  });
  const lessonValid =
    Boolean(prefill) || Boolean(lesson.custom ? lesson.customLocal : lesson.lessonAt);

  return (
    <FieldsDialog
      title={homework ? "Редагувати домашню роботу" : "Призначити домашню роботу"}
      submitLabel={homework ? "Зберегти" : "Призначити"}
      fields={[
        {
          name: "title",
          label: "Назва",
          maxLength: 160,
          defaultValue: homework?.title ?? prefill?.title,
        },
        {
          name: "resourceUrl",
          label: "Посилання на матеріал",
          type: "url",
          optional: true,
          defaultValue: homework?.resourceUrl ?? prefill?.resourceUrl,
        },
        {
          name: "instructions",
          label: "Інструкція",
          type: "multiline",
          optional: true,
          defaultValue: homework?.instructions,
        },
      ]}
      extra={
        <>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={students}
            value={selected}
            onChange={(_, value) => setSelected(value)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(student) => `${student.name} · ${student.grade} клас`}
            renderInput={(params) => (
              <TextField {...params} label="Кому призначити" required={selected.length === 0} />
            )}
          />
          <LessonPicker
            students={selected}
            value={lesson}
            onChange={setLesson}
            optional={Boolean(prefill)}
          />
        </>
      }
      extraValid={selected.length > 0 && lessonValid}
      onClose={onClose}
      onSubmit={async (values) => {
        const lessonAt = lesson.custom
          ? lesson.customLocal && kyivLocalToIso(lesson.customLocal)
          : lesson.lessonAt;
        const body = {
          ...values,
          nextLessonAt: lessonAt || null,
          studentIds: selected.map((student) => student.id),
        };
        if (homework) {
          await api(router.api.assignment(homework.id), {
            method: "PATCH",
            body,
            fallback: errorMessages.homework.saveFailed,
          });
        } else {
          await api(router.api.assignments, {
            body: { ...body, dueAt: null },
            fallback: errorMessages.homework.createFailed,
          });
        }
        await onSaved();
      }}
    />
  );
}

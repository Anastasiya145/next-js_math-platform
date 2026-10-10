"use client";

import { useState } from "react";
import { Alert, MenuItem, TextField } from "@mui/material";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatLesson, isoToKyivLocal } from "@/lib/format";
import { addDays, todayKyiv, type ScheduleData } from "@/lib/schedule";
import { router } from "../router";
import type { HomeworkStudentOption } from "./types";

// `lessonAt` is a suggested lesson (ISO instant); `custom` switches to the manual `customLocal` value (Kyiv time).
export type LessonChoice = { lessonAt: string; custom: boolean; customLocal: string };

type Props = {
  students: HomeworkStudentOption[];
  value: LessonChoice;
  onChange: (value: LessonChoice) => void;
  optional?: boolean;
};

const CUSTOM = "custom";
const HORIZON_DAYS = 60;
const MAX_SUGGESTIONS = 12;

// Suggests the upcoming lessons of the selected students, with a manual date as the fallback.
export function LessonPicker({ students, value, onChange, optional }: Props) {
  const [{ today, now }] = useState(() => ({ today: todayKyiv(), now: Date.now() }));
  const ids = students.map((student) => student.id);
  const schedule = useApi<ScheduleData>(
    ids.length
      ? `${router.api.schedule}?from=${today}&to=${addDays(today, HORIZON_DAYS)}&studentIds=${ids.join(",")}`
      : null,
    errorMessages.schedule.loadFailed,
  );

  const namesByTime = new Map<string, string[]>();
  for (const lesson of schedule.data?.lessons ?? []) {
    if (
      lesson.status !== "planned" ||
      !ids.includes(lesson.studentId) ||
      Date.parse(lesson.startsAt) < now
    ) {
      continue;
    }
    namesByTime.set(lesson.startsAt, [
      ...(namesByTime.get(lesson.startsAt) ?? []),
      lesson.studentName,
    ]);
  }
  const options = [...namesByTime].slice(0, MAX_SUGGESTIONS).map(([startsAt, names]) => ({
    value: startsAt,
    label:
      students.length > 1
        ? `${formatLesson(startsAt)} — ${names.join(", ")}`
        : formatLesson(startsAt),
  }));
  // Keep the current date selectable when it is not one of the suggestions (e.g. when editing).
  if (value.lessonAt && !options.some((option) => option.value === value.lessonAt)) {
    options.unshift({ value: value.lessonAt, label: formatLesson(value.lessonAt) });
  }

  const loading = ids.length > 0 && schedule.loading;
  const manual = value.custom || (!loading && options.length === 0);

  const select = (next: string) =>
    next === CUSTOM
      ? onChange({
          ...value,
          custom: true,
          customLocal: value.customLocal || (value.lessonAt ? isoToKyivLocal(value.lessonAt) : ""),
        })
      : onChange({ ...value, custom: false, lessonAt: next });

  return (
    <>
      {schedule.error && <Alert severity="warning">{schedule.error}</Alert>}
      {(loading || options.length > 0) && (
        <TextField
          select
          label="Наступний урок"
          required={!optional}
          disabled={loading}
          value={value.custom ? CUSTOM : value.lessonAt}
          onChange={(event) => select(event.target.value)}
          helperText={
            loading
              ? "Завантаження розкладу..."
              : "Найближчі уроки з розкладу обраних учнів (за київським часом)"
          }
        >
          {optional && <MenuItem value="">Без дати</MenuItem>}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
          <MenuItem value={CUSTOM}>Інша дата й час...</MenuItem>
        </TextField>
      )}
      {manual && (
        <TextField
          label="Дата й час наступного уроку"
          type="datetime-local"
          required={!optional}
          value={value.customLocal}
          onChange={(event) =>
            onChange({ ...value, custom: true, customLocal: event.target.value })
          }
          helperText={
            options.length === 0 && !schedule.error
              ? "У розкладі немає найближчих уроків обраних учнів"
              : undefined
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    </>
  );
}

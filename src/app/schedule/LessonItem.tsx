"use client";

import { useState } from "react";
import { Chip, Stack } from "@mui/material";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeatOutlined";
import UndoIcon from "@mui/icons-material/UndoOutlined";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import {
  isoToKyivLocal,
  kyivLocalToIso,
  lessonParts,
  lessonTimeRange,
  formatMoney,
} from "@/lib/format";
import {
  isMoved,
  lessonIncome,
  lessonPhase,
  type Lesson,
  type LessonPhase,
  type LessonStatus,
} from "@/lib/schedule";
import { DeleteAction } from "@/components/DeleteAction";
import { FieldsDialog } from "@/components/FieldsDialog";
import { IconAction, ItemRow } from "@/components/ItemRow";
import type { Tone } from "@/components/tones";
import { router } from "../router";

const PHASES: Record<LessonPhase, { tone: Tone; label: string }> = {
  held: { tone: "success", label: "Відбувся" },
  cancelled: { tone: "error", label: "Не відбувся" },
  unmarked: { tone: "warning", label: "Потрібно відмітити" },
  upcoming: { tone: "info", label: "Заплановано" },
};

type Props = {
  lesson: Lesson;
  now: number;
  busy: boolean;
  onMark: (lesson: Lesson, status: LessonStatus) => Promise<unknown>;
  onReset: (lesson: Lesson) => Promise<unknown>;
  onReload: () => Promise<unknown>;
};

// One lesson of the month with the actions to mark, move, reset or delete it.
export function LessonItem({ lesson, now, busy, onMark, onReset, onReload }: Props) {
  const [moving, setMoving] = useState(false);
  const [pending, setPending] = useState<LessonStatus | "reset" | null>(null);
  const phase = lessonPhase(lesson, now);
  const { tone, label } = PHASES[phase];
  const { weekday, date } = lessonParts(lesson.startsAt);
  const moved = isMoved(lesson);
  const key = { studentId: lesson.studentId, scheduledAt: lesson.scheduledAt };

  const move = async (values: Record<string, string>) => {
    await api(router.api.schedule, {
      method: "PATCH",
      body: { ...key, startsAt: kyivLocalToIso(values.startsAt) },
      fallback: errorMessages.schedule.lessonSaveFailed,
    });
    await onReload();
  };

  const track = async (action: LessonStatus | "reset", task: () => Promise<unknown>) => {
    setPending(action);
    try {
      await task();
    } finally {
      setPending(null);
    }
  };

  return (
    <ItemRow
      tone={tone}
      icon={date.split(" ")[0]}
      primary={
        <Stack
          component="span"
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}
        >
          <span>{lesson.studentName}</span>
          <Chip component="span" size="small" color={tone} label={label} />
          {lesson.isExtra && (
            <Chip component="span" size="small" variant="outlined" label="Додатковий" />
          )}
          {moved && <Chip component="span" size="small" variant="outlined" label="Перенесено" />}
        </Stack>
      }
      secondary={`${weekday}, ${date} · ${lessonTimeRange(lesson.startsAt, lesson.durationMinutes)}${
        phase === "cancelled" ? "" : ` · ${formatMoney(lessonIncome(lesson))}`
      }`}
      actions={
        <Stack direction="row" sx={{ flexShrink: 0 }}>
          {lesson.status === "planned" && (
            <IconAction
              label="Відбувся"
              color="success"
              loading={pending === "held"}
              disabled={busy}
              onClick={() => void track("held", () => onMark(lesson, "held"))}
            >
              <CheckCircleIcon />
            </IconAction>
          )}
          {lesson.status !== "cancelled" && (
            <IconAction
              label="Не відбувся"
              color="error"
              loading={pending === "cancelled"}
              disabled={busy}
              onClick={() => void track("cancelled", () => onMark(lesson, "cancelled"))}
            >
              <CancelIcon />
            </IconAction>
          )}
          {lesson.status === "planned" && (
            <IconAction
              label="Перенести"
              color="info"
              disabled={busy}
              onClick={() => setMoving(true)}
            >
              <EventRepeatIcon />
            </IconAction>
          )}
          {(lesson.status !== "planned" || moved) && (
            <IconAction
              label={lesson.isExtra ? "Скасувати відмітку" : "Скинути до розкладу"}
              color="inherit"
              loading={pending === "reset"}
              disabled={busy}
              onClick={() => void track("reset", () => onReset(lesson))}
            >
              <UndoIcon />
            </IconAction>
          )}
          {lesson.isExtra && (
            <DeleteAction
              label="Видалити урок"
              message={`Додатковий урок ${lesson.studentName} буде видалено.`}
              onConfirm={() =>
                api(
                  `${router.api.schedule}?studentId=${lesson.studentId}&scheduledAt=${encodeURIComponent(lesson.scheduledAt)}`,
                  { method: "DELETE", fallback: errorMessages.schedule.lessonDeleteFailed },
                ).then(onReload)
              }
            />
          )}
          {moving && (
            <FieldsDialog
              title={`Перенести урок: ${lesson.studentName}`}
              submitLabel="Перенести"
              fields={[
                {
                  name: "startsAt",
                  label: "Нові дата й час (Київ)",
                  type: "datetime-local",
                  defaultValue: isoToKyivLocal(lesson.startsAt),
                },
              ]}
              onSubmit={move}
              onClose={() => setMoving(false)}
            />
          )}
        </Stack>
      }
    />
  );
}

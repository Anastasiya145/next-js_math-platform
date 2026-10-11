"use client";

import { useState } from "react";
import { Box, Chip, Stack } from "@mui/material";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import EventRepeatIcon from "@mui/icons-material/EventRepeatOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
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
import { formatTopic } from "@/lib/nush";
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
import { LessonTopicDialog } from "./LessonTopicDialog";

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
  // Marking a lesson as held asks what was taught, so it shares the dialog with editing the topic.
  const [topicDialog, setTopicDialog] = useState<"mark" | "edit" | null>(null);
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

  const saveHeld = async (topicId: number | null) => {
    await api(router.api.schedule, {
      method: "PATCH",
      body: { ...key, status: "held", topicId },
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
      secondary={
        <>
          {`${weekday}, ${date} · ${lessonTimeRange(lesson.startsAt, lesson.durationMinutes)}${
            phase === "cancelled" ? "" : ` · ${formatMoney(lessonIncome(lesson))}`
          }`}
          {lesson.topic && (
            <Box component="span" sx={{ display: "block" }}>
              {`Тема: ${formatTopic(lesson.topic)}`}
            </Box>
          )}
        </>
      }
      actions={
        <Stack direction="row" sx={{ flexShrink: 0 }}>
          {lesson.status === "planned" && (
            <IconAction
              label="Відбувся"
              color="success"
              disabled={busy}
              onClick={() => setTopicDialog("mark")}
            >
              <CheckCircleIcon />
            </IconAction>
          )}
          {lesson.status === "held" && (
            <IconAction
              label="Тема уроку"
              color="info"
              disabled={busy}
              onClick={() => setTopicDialog("edit")}
            >
              <MenuBookIcon />
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
          {topicDialog && (
            <LessonTopicDialog
              title={`${topicDialog === "mark" ? "Урок відбувся" : "Тема уроку"}: ${lesson.studentName}`}
              submitLabel={topicDialog === "mark" ? "Відбувся" : "Зберегти"}
              grade={lesson.studentGrade}
              current={lesson.topic}
              onSubmit={saveHeld}
              onClose={() => setTopicDialog(null)}
            />
          )}
        </Stack>
      }
    />
  );
}

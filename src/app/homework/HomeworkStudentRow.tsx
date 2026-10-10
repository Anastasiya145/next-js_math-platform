"use client";

import { useState, type FormEvent } from "react";
import { Alert, Avatar, Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import { api, useAction } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { shade, tint, toneAt } from "@/components/tones";
import { router } from "../router";
import type { HomeworkStudentTarget } from "./types";

type Props = { homeworkId: number; student: HomeworkStudentTarget; onGraded: () => Promise<void> };

const statusOf = (student: HomeworkStudentTarget) => {
  if (student.gradedAt) return { label: "Оцінено", color: "success" } as const;
  if (student.status === "submitted") return { label: "Надіслано", color: "info" } as const;
  if (student.status === "no_homework") return { label: "Немає ДЗ", color: "warning" } as const;
  return { label: "Не виконано", color: "default" } as const;
};

export function HomeworkStudentRow({ homeworkId, student, onGraded }: Props) {
  const [score, setScore] = useState(student.score === null ? "" : String(student.score));
  const [feedback, setFeedback] = useState(student.feedback);
  const { busy, error, run } = useAction();
  const status = statusOf(student);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const saved = await run(() =>
      api(router.api.homeworkGrade(homeworkId), {
        method: "PATCH",
        body: { studentId: student.id, score: Number(score), feedback },
        fallback: errorMessages.homework.gradeSaveFailed,
      }),
    );
    if (saved) await onGraded();
  };

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            bgcolor: tint(toneAt(student.id), 16),
            color: shade(toneAt(student.id)),
            fontWeight: 700,
          }}
        >
          {student.name.charAt(0).toUpperCase()}
        </Avatar>
        <Typography sx={{ fontWeight: 500 }}>{student.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {student.grade} клас
        </Typography>
        <Chip size="small" label={status.label} color={status.color} />
        {student.files.map((file) => (
          <Button
            key={file.id}
            size="small"
            startIcon={<DownloadIcon />}
            href={`${router.api.homeworkSubmission(homeworkId)}?studentId=${student.id}&fileId=${file.id}`}
          >
            {file.name}
          </Button>
        ))}
      </Stack>
      {student.status && (
        <Stack
          component="form"
          onSubmit={save}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mt: 1.5 }}
        >
          <TextField
            type="number"
            label="Оцінка (0–12)"
            required
            value={score}
            onChange={(event) => setScore(event.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 12, step: 1 } }}
            sx={{ width: { sm: 180 }, flexShrink: 0 }}
          />
          <TextField
            label="Коментар учню"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          <Button type="submit" variant="outlined" loading={busy} disabled={score === ""}>
            Зберегти
          </Button>
        </Stack>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

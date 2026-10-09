"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { api, useAction } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatDateTime, formatDay } from "@/lib/format";
import { shade, tint, type Tone } from "@/components/tones";
import { router } from "../router";
import type { StudentHomeworkItem } from "./types";

type Props = {
  homework: StudentHomeworkItem;
  readOnly?: boolean;
  onChanged: () => Promise<unknown>;
};

export function HomeworkAssignmentCard({ homework, readOnly, onChanged }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const { busy, error, run } = useAction();
  const { submission } = homework;
  const tone: Tone = submission.gradedAt
    ? "success"
    : submission.status === "submitted"
      ? "info"
      : submission.status === "no_homework"
        ? "warning"
        : "primary";
  const scoreTone: Tone =
    submission.score === null || submission.score >= 10
      ? "success"
      : submission.score >= 7
        ? "info"
        : submission.score >= 4
          ? "warning"
          : "error";

  const upload = async () => {
    const body = new FormData();
    body.set("file", file!);
    if (
      await run(() =>
        api(router.api.homeworkSubmission(homework.id), {
          body,
          fallback: errorMessages.homework.uploadFailed,
        }),
      )
    ) {
      setFile(null);
      await onChanged();
    }
  };

  const noHomework = async () => {
    if (
      await run(() =>
        api(router.api.homeworkNoHomework(homework.id), {
          method: "POST",
          fallback: errorMessages.homework.noHomeworkSaveFailed,
        }),
      )
    ) {
      await onChanged();
    }
  };

  return (
    <Card
      id={`homework-${homework.id}`}
      sx={{
        borderLeft: `6px solid ${shade(tone)}`,
        background: `linear-gradient(135deg, ${tint(tone, 9)}, transparent 55%), var(--mui-palette-background-paper)`,
      }}
    >
      <CardHeader
        title={homework.title}
        subheader={
          submission.gradedAt ? "Перевірено" : `Здати до: ${formatDateTime(homework.dueAt)}`
        }
        action={
          submission.score !== null && <Chip color={scoreTone} label={`${submission.score}/12`} />
        }
        slotProps={{ title: { variant: "h6", component: "h3" } }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
          {homework.nextLessonAt && (
            <Typography variant="body2" color="text.secondary">
              {submission.gradedAt ? "Урок був" : "Наступний урок"}:{" "}
              {formatDay(homework.nextLessonAt)}
            </Typography>
          )}
          {homework.instructions && <Typography>{homework.instructions}</Typography>}
          {homework.resourceUrl && (
            <Button
              size="small"
              endIcon={<OpenInNewIcon />}
              href={homework.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Матеріали ДЗ
            </Button>
          )}
          {submission.status === "submitted" && (
            <Alert severity="info" sx={{ width: "100%" }}>
              {submission.fileName ? `Надіслано: ${submission.fileName}` : "Роботу надіслано"}
            </Alert>
          )}
          {submission.status === "no_homework" && (
            <Alert severity="warning" sx={{ width: "100%" }}>
              Позначено «Немає ДЗ» · 0 балів
            </Alert>
          )}
          {submission.gradedAt && submission.feedback && (
            <Alert severity="success" sx={{ width: "100%" }}>
              Коментар вчителя: {submission.feedback}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
        </Stack>
      </CardContent>
      {!readOnly && !submission.gradedAt && (
        <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFileIcon />}
            disabled={busy}
          >
            Обрати файл
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Button>
          {file && <Chip label={file.name} onDelete={() => setFile(null)} />}
          <Button variant="contained" disabled={!file || busy} onClick={upload}>
            Надіслати роботу
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <MuiLink
            component="button"
            type="button"
            underline="hover"
            disabled={busy}
            onClick={noHomework}
          >
            Немає ДЗ · 0 балів
          </MuiLink>
        </CardActions>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { api, useAction } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatDue } from "@/lib/format";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_SUBMISSION_FILES,
  MAX_SUBMISSION_SIZE,
  SUBMISSION_FILE_ACCEPT,
} from "@/lib/homework-files";
import { shade, tint, type Tone } from "@/components/tones";
import { router } from "../router";
import type { StudentHomeworkItem } from "./types";

type Props = {
  homework: StudentHomeworkItem;
  readOnly?: boolean;
  onChanged: () => Promise<unknown>;
};

const isSameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export function HomeworkAssignmentCard({ homework, readOnly, onChanged }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { busy, error, run } = useAction();
  const [pending, setPending] = useState<"upload" | "no-homework" | null>(null);
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

  const addFiles = (selected: File[]) => {
    const next = [...files];
    let total = next.reduce((sum, item) => sum + item.size, 0);
    let problem: string | null = null;
    for (const file of selected) {
      if (next.some((item) => isSameFile(item, file))) continue;
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        problem = errorMessages.homework.fileTypeNotAllowed;
      } else if (file.size === 0) {
        problem = errorMessages.homework.fileRequired;
      } else if (file.size > MAX_FILE_SIZE) {
        problem = errorMessages.homework.fileTooLarge;
      } else if (next.length >= MAX_SUBMISSION_FILES) {
        problem = errorMessages.homework.tooManyFiles;
      } else if (total + file.size > MAX_SUBMISSION_SIZE) {
        problem = errorMessages.homework.submissionTooLarge;
      } else {
        next.push(file);
        total += file.size;
      }
    }
    setFiles(next);
    setSelectionError(problem);
  };

  const removeFile = (file: File) => {
    setFiles((current) => current.filter((item) => item !== file));
    setSelectionError(null);
  };

  const upload = async () => {
    const body = new FormData();
    files.forEach((file) => body.append("file", file));
    setPending("upload");
    if (
      await run(() =>
        api(router.api.homeworkSubmission(homework.id), {
          body,
          fallback: errorMessages.homework.uploadFailed,
        }),
      )
    ) {
      setFiles([]);
      await onChanged();
    }
  };

  const noHomework = async () => {
    setPending("no-homework");
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
          submission.gradedAt
            ? "Перевірено"
            : `Здати до: ${formatDue(homework.nextLessonAt, homework.dueAt)}`
        }
        action={
          submission.score !== null && <Chip color={scoreTone} label={`${submission.score}/12`} />
        }
        slotProps={{ title: { variant: "h6", component: "h3" } }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
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
              {submission.files.length > 0
                ? `Надіслано: ${submission.files.map((file) => file.name).join(", ")}`
                : "Роботу надіслано"}
              {!submission.gradedAt && " · чекає перевірки"}
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
          {!readOnly && !submission.status && files.length > 0 && (
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, maxWidth: "100%" }}>
              {files.map((file) => (
                <Chip
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  label={file.name}
                  disabled={busy}
                  onDelete={() => removeFile(file)}
                  sx={{ maxWidth: "100%" }}
                />
              ))}
            </Stack>
          )}
          {selectionError && (
            <Alert severity="warning" sx={{ width: "100%" }}>
              {selectionError}
            </Alert>
          )}
        </Stack>
      </CardContent>
      {!readOnly && !submission.status && (
        <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFileIcon />}
            disabled={busy}
          >
            {files.length > 0 ? "Додати ще файли" : "Обрати файли"}
            <input
              hidden
              multiple
              type="file"
              accept={SUBMISSION_FILE_ACCEPT}
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </Button>
          <Button
            variant="contained"
            loading={busy && pending === "upload"}
            disabled={files.length === 0 || busy}
            onClick={upload}
          >
            {files.length > 1 ? `Надіслати роботу (${files.length})` : "Надіслати роботу"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            або
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            loading={busy && pending === "no-homework"}
            disabled={busy}
            onClick={noHomework}
          >
            Немає ДЗ · 0 балів
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

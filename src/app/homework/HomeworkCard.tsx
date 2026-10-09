"use client";

import { Fragment } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatDateTime, formatDay } from "@/lib/format";
import { ActionRow } from "@/components/ActionRow";
import { DeleteAction } from "@/components/DeleteAction";
import { shade, tint } from "@/components/tones";
import { router } from "../router";
import { HomeworkStudentRow } from "./HomeworkStudentRow";
import type { TeacherHomework } from "./types";

type Props = { homework: TeacherHomework; onChanged: () => Promise<void> };

export function HomeworkCard({ homework, onChanged }: Props) {
  const pending = homework.students.filter((student) => student.status && !student.gradedAt).length;
  const tone = pending ? "warning" : "success";

  return (
    <ActionRow
      action={
        <DeleteAction
          label={`Видалити: ${homework.title}`}
          message={`Завдання «${homework.title}» разом з усіма надісланими роботами та оцінками буде видалено.`}
          onConfirm={async () => {
            await api(router.api.assignment(homework.id), {
              method: "DELETE",
              fallback: errorMessages.homework.deleteFailed,
            });
            await onChanged();
          }}
        />
      }
    >
      <Accordion disableGutters variant="outlined" sx={{ borderLeft: `6px solid ${shade(tone)}` }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Avatar
            variant="rounded"
            sx={{ mr: 1.5, alignSelf: "center", bgcolor: tint(tone, 16), color: shade(tone) }}
          >
            <AssignmentIcon />
          </Avatar>
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>{homework.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {homework.nextLessonAt
                ? `Наступний урок: ${formatDay(homework.nextLessonAt)} · `
                : ""}
              {formatDateTime(homework.dueAt)}
            </Typography>
          </Stack>
          <Chip
            size="small"
            sx={{ mr: 1, alignSelf: "center" }}
            color={tone}
            label={pending ? `На перевірку: ${pending}` : `Учнів: ${homework.students.length}`}
          />
        </AccordionSummary>
        <AccordionDetails>
          {homework.instructions && (
            <Typography sx={{ whiteSpace: "pre-wrap", mb: 1 }}>{homework.instructions}</Typography>
          )}
          {homework.resourceUrl && (
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              href={homework.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Матеріал до завдання
            </Button>
          )}
          <Divider sx={{ mt: 1 }} />
          {homework.students.map((student, index) => (
            <Fragment key={student.id}>
              {index > 0 && <Divider />}
              <HomeworkStudentRow homeworkId={homework.id} student={student} onGraded={onChanged} />
            </Fragment>
          ))}
        </AccordionDetails>
      </Accordion>
    </ActionRow>
  );
}

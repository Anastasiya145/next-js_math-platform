"use client";

import { Fragment, useState } from "react";
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
import EditIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatDue } from "@/lib/format";
import { ActionRow } from "@/components/ActionRow";
import { DeleteAction } from "@/components/DeleteAction";
import { IconAction } from "@/components/ItemRow";
import { shade, tint } from "@/components/tones";
import { router } from "../router";
import { HomeworkForm } from "./HomeworkForm";
import { HomeworkStudentRow } from "./HomeworkStudentRow";
import { homeworkStatus } from "./status";
import type { HomeworkStudentOption, TeacherHomework } from "./types";

type Props = {
  homework: TeacherHomework;
  students: HomeworkStudentOption[];
  onChanged: () => Promise<void>;
};

export function HomeworkCard({ homework, students, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const status = homeworkStatus(homework);
  const tone = status.tone;
  const studentNames = homework.students.map((student) => student.name).join(", ");

  return (
    <ActionRow
      action={
        <>
          <IconAction
            label={`Редагувати: ${homework.title}`}
            color="warning"
            onClick={() => setEditing(true)}
          >
            <EditIcon />
          </IconAction>
          {editing && (
            <HomeworkForm
              homework={homework}
              students={students}
              onSaved={onChanged}
              onClose={() => setEditing(false)}
            />
          )}
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
        </>
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
              Здати до: {formatDue(homework.nextLessonAt, homework.dueAt)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ mr: 1, alignSelf: "center", alignItems: "center", maxWidth: "50%" }}
          >
            <Chip
              size="small"
              variant="outlined"
              title={studentNames}
              label={studentNames}
              sx={{ minWidth: 0 }}
            />
            <Chip size="small" color={tone} label={status.label} sx={{ flexShrink: 0 }} />
          </Stack>
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

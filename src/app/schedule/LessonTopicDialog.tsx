"use client";

import { useState } from "react";
import { LinearProgress, MenuItem, TextField } from "@mui/material";
import { useApi } from "@/lib/api";
import type { NushTopic } from "@/lib/db";
import { errorMessages } from "@/lib/error-messages";
import {
  LANGUAGE_LEVELS,
  type LanguageLevel,
  type LanguageTopic,
} from "@/lib/language-course";
import {
  NUSH_SPLIT_GRADE,
  NUSH_SPLIT_SUBJECTS,
  NUSH_SUBJECT_LABELS,
  isSplitSubject,
  type NushSubject,
} from "@/lib/nush";
import type { LessonTopic, StudentCourse } from "@/lib/schedule";
import { FormDialog } from "@/components/FormDialog";
import { router } from "../router";

type Props = {
  title: string;
  submitLabel: string;
  grade: number;
  course: StudentCourse | null;
  current: LessonTopic | null;
  onSubmit: (topicId: number | null) => Promise<unknown>;
  onClose: () => void;
};

// Picks what was taught: NUSH topics of the student's grade (algebra and geometry from grade 7),
// or course topics by level for a language student.
export function LessonTopicDialog({
  title,
  submitLabel,
  grade,
  course,
  current,
  onSubmit,
  onClose,
}: Props) {
  const { data, loading, error } = useApi<Array<NushTopic | LanguageTopic>>(
    course
      ? `${router.api.languageTopics}?language=${course.language}`
      : `${router.api.nush}?grade=${grade}`,
    course
      ? errorMessages.languageCourse.loadFailed
      : errorMessages.materials.loadFailed,
  );
  const split = !course && grade >= NUSH_SPLIT_GRADE;
  const [subject, setSubject] = useState<NushSubject>(
    isSplitSubject(current?.subject) ? current.subject : "algebra",
  );
  const [topicId, setTopicId] = useState(current?.id ? String(current.id) : "");
  const currentLevel = (data ?? []).find(
    (topic): topic is LanguageTopic =>
      "level" in topic && topic.id === current?.id,
  )?.level;
  const [chosenLevel, setChosenLevel] = useState<LanguageLevel | null>(null);
  const level = chosenLevel ?? currentLevel ?? course?.level ?? "A1";

  const topics = (data ?? []).filter((topic) =>
    "level" in topic
      ? topic.level === level
      : !split || topic.subject === subject,
  );
  // A topic that is not in the list (deleted or from another grade) cannot be shown as selected.
  const selected = topics.some((topic) => String(topic.id) === topicId)
    ? topicId
    : "";

  return (
    <FormDialog
      title={title}
      submitLabel={submitLabel}
      submitDisabled={loading}
      onClose={onClose}
      onSubmit={() => onSubmit(selected ? Number(selected) : null)}
    >
      {loading && <LinearProgress aria-label="Завантаження тем" />}
      {split && (
        <TextField
          select
          label="Розділ"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value as NushSubject);
            setTopicId("");
          }}
        >
          {NUSH_SPLIT_SUBJECTS.map((value) => (
            <MenuItem key={value} value={value}>
              {NUSH_SUBJECT_LABELS[value]}
            </MenuItem>
          ))}
        </TextField>
      )}
      {course && (
        <TextField
          select
          label="Рівень"
          value={level}
          onChange={(event) => {
            setChosenLevel(event.target.value as LanguageLevel);
            setTopicId("");
          }}
        >
          {LANGUAGE_LEVELS.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        select
        label="Тема уроку"
        value={selected}
        onChange={(event) => setTopicId(event.target.value)}
        disabled={loading}
        error={Boolean(error)}
        helperText={
          error ??
          (!loading && topics.length === 0
            ? "Тем для цього розділу ще немає. Додайте їх у розділі «Матеріали»"
            : undefined)
        }
        slotProps={{
          select: { displayEmpty: true },
          inputLabel: { shrink: true },
        }}
      >
        <MenuItem value="">Без теми</MenuItem>
        {topics.map((topic) => (
          <MenuItem key={topic.id} value={String(topic.id)}>
            {topic.title}
          </MenuItem>
        ))}
      </TextField>
    </FormDialog>
  );
}

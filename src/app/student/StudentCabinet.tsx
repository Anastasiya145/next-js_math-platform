"use client";

import type { ReactNode } from "react";
import { Button, Grid, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLateOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import EventIcon from "@mui/icons-material/EventOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import StarIcon from "@mui/icons-material/StarOutlineRounded";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { lessonParts } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSection";
import { ProgressChart } from "@/components/ProgressChart";
import { StatCard } from "@/components/StatCard";
import type { Tone } from "@/components/tones";
import { router } from "../router";
import { StudentTextbooksEditor } from "../students/StudentTextbooksEditor";
import { HomeworkAssignmentCard } from "./HomeworkAssignmentCard";
import { StudentTextbookList } from "./StudentTextbookList";
import type { StudentDashboardData, StudentHomeworkItem } from "./types";

type Props = { studentId?: number };

// The student's own cabinet, or the same view for the teacher when `studentId` is given.
export function StudentCabinet({ studentId }: Props) {
  const url = studentId
    ? `${router.api.studentDashboard}?studentId=${studentId}`
    : router.api.studentDashboard;
  const { data, error, loading, reload } = useApi<StudentDashboardData>(
    url,
    errorMessages.studentDashboard.loadFailed,
  );
  const teacherView = Boolean(studentId);

  const homeworks = data?.homeworks ?? [];
  const active = homeworks.filter((homework) => !homework.submission.status);
  const activityAt = (homework: StudentHomeworkItem) =>
    homework.submission.gradedAt ?? homework.submission.submittedAt ?? "";
  const completed = homeworks
    .filter((homework) => homework.submission.status)
    .sort((first, second) => activityAt(second).localeCompare(activityAt(first)));
  const nextLesson = homeworks
    .filter((homework) => homework.nextLessonAt && !homework.submission.gradedAt)
    .sort((first, second) => first.nextLessonAt!.localeCompare(second.nextLessonAt!))[0];
  const lesson = nextLesson ? lessonParts(nextLesson.nextLessonAt!) : null;

  const homeworkSection = (
    title: string,
    items: StudentHomeworkItem[],
    emptyText: string,
    icon: ReactNode,
    tone: Tone,
  ) => (
    <PageSection
      title={title}
      subtitle={String(items.length)}
      icon={icon}
      tone={tone}
      empty={items.length === 0}
      emptyText={emptyText}
    >
      <Stack spacing={2}>
        {items.map((homework) => (
          <HomeworkAssignmentCard
            key={homework.id}
            homework={homework}
            readOnly={teacherView}
            onChanged={reload}
          />
        ))}
      </Stack>
    </PageSection>
  );

  return (
    <AppShell
      title={teacherView ? (data?.student.name ?? "Учень") : "Навчальний простір"}
      subtitle={
        data
          ? `${data.student.grade} клас${teacherView ? " · перегляд кабінету учня" : " · кабінет учня"}`
          : undefined
      }
      actions={
        teacherView && (
          <Button startIcon={<ArrowBackIcon />} href={router.students}>
            До списку
          </Button>
        )
      }
    >
      {loading || error || !data ? (
        <PageSection title="Кабінет" loading={loading} error={error} />
      ) : (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                label="Середній бал"
                value={data.averageScore === null ? "—" : `${data.averageScore.toFixed(1)}/12`}
                hint={
                  data.gradedCount
                    ? `${data.gradedCount} оцінених робіт`
                    : "Ще немає оцінених робіт"
                }
                icon={<StarIcon />}
                tone="success"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                label="Потрібно виконати"
                value={active.length}
                hint="домашніх робіт"
                icon={<AssignmentLateIcon />}
                tone="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                label="Наступний урок"
                value={lesson ? `${lesson.date}, ${lesson.time}` : "—"}
                hint={lesson ? `${lesson.weekday} · ${nextLesson?.title}` : undefined}
                icon={<EventIcon />}
                tone="info"
              />
            </Grid>
          </Grid>
          <PageSection
            title="Доступні підручники"
            subtitle={`Для ${data.student.grade} класу`}
            icon={<MenuBookIcon />}
            tone="success"
            empty={data.textbooks.length === 0}
            emptyText={`Підручники для ${data.student.grade} класу ще не додані.`}
          >
            <StudentTextbookList textbooks={data.textbooks} />
          </PageSection>
          {teacherView && <StudentTextbooksEditor studentId={studentId!} />}
          {homeworkSection(
            "Актуальна домашня робота",
            active,
            "Усе виконано. Нова робота з'явиться тут.",
            <AssignmentLateIcon />,
            "warning",
          )}
          {homeworkSection(
            "Завершені роботи",
            completed,
            "Надіслані й перевірені роботи з'являться тут.",
            <AssignmentTurnedInIcon />,
            "success",
          )}
          <ProgressChart studentName={data.student.name} points={data.progress} />
        </Stack>
      )}
    </AppShell>
  );
}

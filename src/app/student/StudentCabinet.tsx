"use client";

import type { ReactNode } from "react";
import { Button, Grid, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLateOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import EventIcon from "@mui/icons-material/EventOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import StarIcon from "@mui/icons-material/StarOutlineRounded";
import { api, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { homeworkTime, lessonParts } from "@/lib/format";
import { AddAction } from "@/components/AddAction";
import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSection";
import { ProgressChart } from "@/components/ProgressChart";
import { StatCard } from "@/components/StatCard";
import type { Tone } from "@/components/tones";
import { router } from "../router";
import { HomeworkAssignmentCard } from "./HomeworkAssignmentCard";
import { ReportAction } from "./ReportAction";
import { StudentTextbookList } from "./StudentTextbookList";
import type { StudentDashboardData, StudentHomeworkItem } from "./types";
import { useAppLanguage } from "@/lib/LanguageProvider";

type Props = { studentId?: number };

// The student's own cabinet, or the same view for the teacher when `studentId` is given.
export function StudentCabinet({ studentId }: Props) {
  const { locale, siteType, baseLanguage, targetLanguage, t } =
    useAppLanguage();
  const url = studentId
    ? `${router.api.studentDashboard}?studentId=${studentId}`
    : router.api.studentDashboard;
  const { data, error, loading, reload } = useApi<StudentDashboardData>(
    url,
    t("errorDashboard"),
    locale,
  );
  const teacherView = Boolean(studentId);

  const homeworks = data?.homeworks ?? [];
  // Open work: nearest date first. Finished work: latest date first.
  const active = homeworks
    .filter((homework) => !homework.submission.status)
    .sort((first, second) => homeworkTime(first) - homeworkTime(second));
  const completed = homeworks
    .filter((homework) => homework.submission.status)
    .sort((first, second) => homeworkTime(second) - homeworkTime(first));
  const nextLesson = homeworks
    .filter(
      (homework) => homework.nextLessonAt && !homework.submission.gradedAt,
    )
    .sort((first, second) =>
      first.nextLessonAt!.localeCompare(second.nextLessonAt!),
    )[0];
  const lesson = nextLesson
    ? lessonParts(nextLesson.nextLessonAt!, locale)
    : null;

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
      title={
        teacherView
          ? (data?.student.name ?? t("studentFallback"))
          : t("portalTitle")
      }
      subtitle={
        data
          ? siteType === "languages" && baseLanguage && targetLanguage
            ? t("languagePair", {
                base: t(baseLanguage === "fr" ? "french" : "russian"),
                target: t(targetLanguage === "fr" ? "french" : "russian"),
              })
            : `${t("gradeLabel", { grade: data.student.grade })} · ${t(
                teacherView ? "teacherCabinetSuffix" : "studentCabinetSuffix",
              )}`
          : undefined
      }
      actions={
        teacherView && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button startIcon={<ArrowBackIcon />} href={router.students}>
              До списку
            </Button>
            {studentId && data && (
              <ReportAction
                studentId={studentId}
                studentName={data.student.name}
              />
            )}
          </Stack>
        )
      }
    >
      {loading || error || !data ? (
        <PageSection title={t("cabinet")} loading={loading} error={error} />
      ) : (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                label={t("averageScore")}
                value={
                  data.averageScore === null
                    ? "—"
                    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(data.averageScore)}/12`
                }
                hint={
                  data.gradedCount
                    ? `${data.gradedCount} ${t("gradedWorks")}`
                    : t("noGradedWorks")
                }
                icon={<StarIcon />}
                tone="success"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                label={t("activeWorksCount")}
                value={active.length}
                hint={t("homework")}
                icon={<AssignmentLateIcon />}
                tone="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard
                label={t("nextLesson")}
                value={lesson ? `${lesson.date}, ${lesson.time}` : "—"}
                hint={
                  lesson
                    ? `${lesson.weekday} · ${nextLesson?.title}`
                    : undefined
                }
                icon={<EventIcon />}
                tone="info"
              />
            </Grid>
          </Grid>
          <PageSection
            title={t("textbooks")}
            subtitle={t("forGrade", { grade: data.student.grade })}
            icon={<MenuBookIcon />}
            tone="success"
            action={
              teacherView && (
                <AddAction
                  label="Підручник"
                  color="success"
                  title={`Новий підручник для ${data.student.grade} класу`}
                  fields={[
                    {
                      name: "title",
                      label: "Назва підручника",
                      maxLength: 180,
                    },
                    { name: "url", label: "Посилання", type: "url" },
                    {
                      name: "subject",
                      label: "Предмет",
                      maxLength: 80,
                      defaultValue:
                        data.student.grade <= 6 ? "Математика" : "Алгебра",
                    },
                    {
                      name: "author",
                      label: "Автор",
                      optional: true,
                      maxLength: 160,
                    },
                  ]}
                  onSubmit={async (values) => {
                    // Grade-wide on purpose: it joins the class library and every student of the grade sees it.
                    await api(router.api.textbooks, {
                      body: {
                        ...values,
                        grade: data.student.grade,
                        resourceType: "textbook",
                      },
                      fallback: errorMessages.textbooks.addFailed,
                    });
                    await reload();
                  }}
                />
              )
            }
            empty={data.textbooks.length === 0}
            emptyText={t("textbooksEmpty", { grade: data.student.grade })}
          >
            <StudentTextbookList textbooks={data.textbooks} />
          </PageSection>
          {homeworkSection(
            t("currentHomework"),
            active,
            t("allDone"),
            <AssignmentLateIcon />,
            "warning",
          )}
          {homeworkSection(
            t("completedWorks"),
            completed,
            t("completedEmpty"),
            <AssignmentTurnedInIcon />,
            "success",
          )}
          <ProgressChart
            studentName={data.student.name}
            points={data.progress}
          />
        </Stack>
      )}
    </AppShell>
  );
}

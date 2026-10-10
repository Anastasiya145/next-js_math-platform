"use client";

import { useState } from "react";
import { Alert, Chip, Grid, List, Stack, Tab, Tabs, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import EditCalendarIcon from "@mui/icons-material/EditCalendarOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailableOutlined";
import PaidIcon from "@mui/icons-material/PaidOutlined";
import PendingActionsIcon from "@mui/icons-material/PendingActionsOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { formatHours, formatMoney, kyivLocalToIso } from "@/lib/format";
import type { PaymentsData } from "@/lib/payments";
import {
  slotLabel,
  summarizeBudget,
  monthRange,
  type Lesson,
  type LessonStatus,
  type ScheduleData,
  type ScheduleStudent,
} from "@/lib/schedule";
import { AddAction } from "@/components/AddAction";
import { IconAction, ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import { StatCard } from "@/components/StatCard";
import type { Tone } from "@/components/tones";
import { router } from "../router";
import { LessonItem } from "./LessonItem";
import { PaymentsSections } from "./PaymentsSections";
import { ScheduleDialog } from "./ScheduleDialog";

const DURATION_OPTIONS: Array<[string, string]> = [30, 45, 60, 90, 120].map((minutes) => [
  String(minutes),
  `${minutes} хв`,
]);

// Planned also holds past lessons that still need a mark.
const LESSON_TABS: Record<LessonStatus, { label: string; tone: Tone; empty: string }> = {
  planned: {
    label: "Заплановані",
    tone: "info",
    empty: "Запланованих уроків у цьому місяці немає",
  },
  held: {
    label: "Проведені",
    tone: "success",
    empty: "Проведених уроків у цьому місяці поки немає",
  },
  cancelled: { label: "Не відбулися", tone: "error", empty: "Уроків, що не відбулися, немає" },
};
const LESSON_TABS_LIST = Object.entries(LESSON_TABS) as Array<
  [LessonStatus, (typeof LESSON_TABS)[LessonStatus]]
>;

const scheduleText = (student: ScheduleStudent) => {
  const active = student.slots.filter((slot) => slot.endsOn === null);
  const slots = active.length
    ? active
        .map(
          (slot) =>
            `${slotLabel(slot)}${slot.durationMinutes === 60 ? "" : ` (${slot.durationMinutes} хв)`}`,
        )
        .join(", ")
    : "Розклад не задано";
  return `${slots} · ${formatMoney(student.hourlyRate)}/год`;
};

// Everything for one month. Mount with `key={month}` so each month loads with its own state.
export function ScheduleMonth({ month }: { month: string }) {
  const { from, to } = monthRange(month);
  const schedule = useApi<ScheduleData>(
    `${router.api.schedule}?from=${from}&to=${to}`,
    errorMessages.schedule.loadFailed,
  );
  const mutation = useAction();
  const payments = useApi<PaymentsData>(
    `${router.api.payments}?from=${from}&to=${to}`,
    errorMessages.payments.loadFailed,
  );
  const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState<ScheduleStudent | null>(null);
  const [tab, setTab] = useState<LessonStatus>("planned");

  const students = schedule.data?.students ?? [];
  const lessons = schedule.data?.lessons ?? [];
  const visibleLessons = lessons.filter((lesson) => lesson.status === tab);
  const budget = summarizeBudget(lessons, now);
  const { totals } = budget;

  // Held lessons change what parents owe, so payments reload together with the schedule.
  const reload = async () => {
    setNow(Date.now());
    await Promise.all([schedule.reload(), payments.reload()]);
  };

  const patchLesson = (lesson: Lesson, change: { status: LessonStatus; startsAt?: string }) =>
    mutation.run(async () => {
      await api(router.api.schedule, {
        method: "PATCH",
        body: { studentId: lesson.studentId, scheduledAt: lesson.scheduledAt, ...change },
        fallback: errorMessages.schedule.lessonSaveFailed,
      });
      await reload();
    });

  const mark = (lesson: Lesson, status: LessonStatus) => patchLesson(lesson, { status });
  const reset = (lesson: Lesson) =>
    patchLesson(lesson, { status: "planned", startsAt: lesson.scheduledAt });

  const addExtra = async (values: Record<string, string>) => {
    await api(router.api.schedule, {
      method: "POST",
      body: {
        studentId: Number(values.studentId),
        startsAt: kyivLocalToIso(values.startsAt),
        durationMinutes: Number(values.durationMinutes),
      },
      fallback: errorMessages.schedule.lessonSaveFailed,
    });
    await reload();
  };

  return (
    <Stack spacing={2}>
      {schedule.data && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Проведено"
              value={formatMoney(totals.heldIncome)}
              hint={`${totals.held} уроків · ${formatHours(totals.heldMinutes)}`}
              icon={<CheckCircleIcon />}
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Попереду"
              value={formatMoney(totals.upcomingIncome)}
              hint={`${totals.upcoming} уроків`}
              icon={<EventAvailableIcon />}
              tone="info"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Разом за місяць"
              value={formatMoney(totals.heldIncome + totals.upcomingIncome)}
              hint="Проведені та заплановані"
              icon={<PaidIcon />}
              tone="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard
              label="Потрібно відмітити"
              value={totals.unmarked}
              hint={
                totals.cancelled > 0
                  ? `Не відбулося: ${totals.cancelled}`
                  : "Минулі уроки відмічені"
              }
              icon={<PendingActionsIcon />}
              tone="warning"
            />
          </Grid>
        </Grid>
      )}
      <PageSection
        title="Бюджет за учнями"
        subtitle="Дохід за місяць з кожного учня"
        icon={<AccountBalanceWalletIcon />}
        tone="success"
        loading={schedule.loading}
        error={schedule.error}
        empty={budget.lines.length === 0}
        emptyText="У цьому місяці уроків немає"
      >
        <List disablePadding>
          {budget.lines.map((line) => (
            <ItemRow
              key={line.studentId}
              tone="success"
              icon={line.name.charAt(0)}
              primary={line.name}
              secondary={[
                `Проведено: ${line.held} (${formatHours(line.heldMinutes)})`,
                `попереду: ${line.upcoming}`,
                line.unmarked > 0 ? `не відмічено: ${line.unmarked}` : null,
                line.cancelled > 0 ? `не відбулося: ${line.cancelled}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <Stack sx={{ alignItems: "flex-end", flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatMoney(line.heldIncome + line.upcomingIncome)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    проведено {formatMoney(line.heldIncome)}
                  </Typography>
                </Stack>
              }
            />
          ))}
        </List>
      </PageSection>
      <PaymentsSections
        data={payments.data}
        loading={payments.loading}
        error={payments.error}
        onReload={payments.reload}
      />
      <PageSection
        title="Розклад учнів"
        subtitle="Постійні дні й час уроків та ставка за годину"
        icon={<CalendarMonthIcon />}
        tone="secondary"
        loading={schedule.loading}
        empty={!schedule.loading && students.length === 0}
        emptyText="Спочатку додайте учнів"
      >
        <List disablePadding>
          {students.map((student) => (
            <ItemRow
              key={student.id}
              tone="secondary"
              icon={student.name.charAt(0)}
              primary={student.name}
              secondary={scheduleText(student)}
              actions={
                <IconAction
                  label={`Змінити розклад: ${student.name}`}
                  onClick={() => setEditing(student)}
                >
                  <EditCalendarIcon />
                </IconAction>
              }
            />
          ))}
        </List>
      </PageSection>
      <PageSection
        title="Уроки місяця"
        subtitle="Відмічайте, чи відбувся урок, або переносьте його на іншу дату"
        icon={<ScheduleIcon />}
        tone="info"
        action={
          <AddAction
            label="Додатковий урок"
            variant="outlined"
            fields={[
              {
                name: "studentId",
                label: "Учень",
                type: "select",
                options: students.map((student) => [String(student.id), student.name]),
              },
              { name: "startsAt", label: "Дата й час (Київ)", type: "datetime-local" },
              {
                name: "durationMinutes",
                label: "Тривалість",
                type: "select",
                options: DURATION_OPTIONS,
                defaultValue: "60",
              },
            ]}
            extraValid={students.length > 0}
            submitLabel="Додати"
            onSubmit={addExtra}
          />
        }
        loading={schedule.loading}
        empty={lessons.length === 0}
        emptyText="У цьому місяці уроків немає. Задайте розклад учня або додайте урок вручну"
      >
        {mutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutation.error}
          </Alert>
        )}
        <Tabs
          value={tab}
          onChange={(_, value: LessonStatus) => setTab(value)}
          variant="scrollable"
          aria-label="Статус уроків"
          sx={{ mb: 1 }}
        >
          {LESSON_TABS_LIST.map(([value, { label, tone }]) => {
            const count = lessons.filter((lesson) => lesson.status === value).length;
            return (
              <Tab
                key={value}
                value={value}
                label={
                  <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <span>{label}</span>
                    <Chip size="small" color={count > 0 ? tone : "default"} label={count} />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
        <List disablePadding>
          {visibleLessons.map((lesson) => (
            <LessonItem
              key={`${lesson.studentId}|${lesson.scheduledAt}`}
              lesson={lesson}
              now={now}
              busy={mutation.busy}
              onMark={mark}
              onReset={reset}
              onReload={reload}
            />
          ))}
        </List>
        {visibleLessons.length === 0 && (
          <Typography color="text.secondary">{LESSON_TABS[tab].empty}</Typography>
        )}
      </PageSection>
      {editing && (
        <ScheduleDialog student={editing} onSaved={reload} onClose={() => setEditing(null)} />
      )}
    </Stack>
  );
}

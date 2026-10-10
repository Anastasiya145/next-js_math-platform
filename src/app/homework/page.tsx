"use client";

import { useState } from "react";
import { Box, Button, Chip, Stack, Tab, Tabs } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheckOutlined";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";
import { HomeworkCard } from "./HomeworkCard";
import { HomeworkForm } from "./HomeworkForm";
import { pendingReviewCount } from "./status";
import type { HomeworkStudentOption, TeacherHomework } from "./types";

const TABS = [
  {
    key: "review",
    label: "На перевірку",
    title: "Роботи на перевірку",
    icon: <FactCheckIcon />,
    tone: "warning",
    emptyText: "Немає робіт, які чекають на оцінку",
  },
  {
    key: "active",
    label: "Активні",
    title: "Активні завдання",
    icon: <AssignmentIcon />,
    tone: "info",
    emptyText: "Домашніх завдань, що очікують виконання, немає",
  },
  {
    key: "completed",
    label: "Завершені",
    title: "Завершені роботи",
    icon: <AssignmentTurnedInIcon />,
    tone: "success",
    emptyText: "Завершених робіт поки немає",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HomeworkPage() {
  const homework = useApi<TeacherHomework[]>(
    router.api.assignments,
    errorMessages.homework.loadFailed,
  );
  const students = useApi<HomeworkStudentOption[]>(
    router.api.students,
    errorMessages.students.loadFailed,
  );
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<TabKey | null>(null);
  const items = homework.data ?? [];
  const review = items.filter((item) => pendingReviewCount(item) > 0);
  const completed = items.filter(
    (item) => item.students.length > 0 && item.students.every((student) => student.gradedAt),
  );
  const active = items.filter((item) => !review.includes(item) && !completed.includes(item));
  const groups = { review, active, completed };
  // Until the teacher picks a tab, open the one that needs attention first.
  const currentKey = tab ?? (review.length > 0 ? "review" : "active");
  const current = TABS.find((item) => item.key === currentKey) ?? TABS[1];
  const works = groups[current.key];

  return (
    <AppShell
      title="Домашні завдання"
      subtitle="Призначайте роботи та перевіряйте надіслане"
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!students.data?.length}
          onClick={() => setCreating(true)}
        >
          Призначити
        </Button>
      }
    >
      <Stack spacing={2}>
        <Tabs
          value={current.key}
          onChange={(_, value: TabKey) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Статуси домашніх завдань"
        >
          {TABS.map((item) => (
            <Tab
              key={item.key}
              value={item.key}
              id={`homework-tab-${item.key}`}
              aria-controls="homework-panel"
              icon={item.icon}
              iconPosition="start"
              label={
                <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <span>{item.label}</span>
                  <Chip
                    size="small"
                    label={groups[item.key].length}
                    color={groups[item.key].length > 0 ? item.tone : "default"}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
        <Box id="homework-panel" role="tabpanel" aria-labelledby={`homework-tab-${current.key}`}>
          <PageSection
            title={current.title}
            subtitle={students.data?.length === 0 ? "Спочатку додайте учнів" : undefined}
            icon={current.icon}
            tone={current.tone}
            loading={homework.loading}
            error={homework.error ?? students.error}
            empty={works.length === 0}
            emptyText={items.length === 0 ? "Домашніх завдань ще немає" : current.emptyText}
          >
            <Stack spacing={1.5}>
              {works.map((item) => (
                <HomeworkCard
                  key={item.id}
                  homework={item}
                  students={students.data ?? []}
                  onChanged={homework.reload}
                />
              ))}
            </Stack>
          </PageSection>
        </Box>
      </Stack>
      {creating && (
        <HomeworkForm
          students={students.data ?? []}
          onSaved={homework.reload}
          onClose={() => setCreating(false)}
        />
      )}
    </AppShell>
  );
}

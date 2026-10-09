"use client";

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheckOutlined";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";
import { HomeworkCard, pendingReviewCount } from "./HomeworkCard";
import { HomeworkForm } from "./HomeworkForm";
import type { HomeworkStudentOption, TeacherHomework } from "./types";

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
  const items = homework.data ?? [];
  const review = items.filter((item) => pendingReviewCount(item) > 0);
  const completed = items.filter(
    (item) => item.students.length > 0 && item.students.every((student) => student.gradedAt),
  );
  const active = items.filter((item) => !review.includes(item) && !completed.includes(item));

  const list = (works: TeacherHomework[]) => (
    <Stack spacing={1.5}>
      {works.map((item) => (
        <HomeworkCard key={item.id} homework={item} onChanged={homework.reload} />
      ))}
    </Stack>
  );

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
        {(homework.loading || homework.error || students.error || items.length === 0) && (
          <PageSection
            title="Роботи"
            icon={<AssignmentIcon />}
            tone="warning"
            subtitle={students.data?.length === 0 ? "Спочатку додайте учнів" : undefined}
            loading={homework.loading}
            error={homework.error ?? students.error}
            empty
            emptyText="Домашніх завдань ще немає"
          />
        )}
        {review.length > 0 && (
          <PageSection
            title="На перевірку"
            subtitle={String(review.length)}
            icon={<FactCheckIcon />}
            tone="warning"
          >
            {list(review)}
          </PageSection>
        )}
        {active.length > 0 && (
          <PageSection
            title="Активні завдання"
            subtitle={String(active.length)}
            icon={<AssignmentIcon />}
            tone="info"
          >
            {list(active)}
          </PageSection>
        )}
        {completed.length > 0 && (
          <PageSection
            title="Завершені роботи"
            subtitle={String(completed.length)}
            icon={<AssignmentTurnedInIcon />}
            tone="success"
          >
            {list(completed)}
          </PageSection>
        )}
      </Stack>
      {creating && (
        <HomeworkForm
          students={students.data ?? []}
          onCreated={homework.reload}
          onClose={() => setCreating(false)}
        />
      )}
    </AppShell>
  );
}

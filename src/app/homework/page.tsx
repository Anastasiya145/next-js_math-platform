"use client";

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import { useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";
import { HomeworkCard } from "./HomeworkCard";
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
      <PageSection
        title="Роботи"
        icon={<AssignmentIcon />}
        tone="warning"
        subtitle={students.data?.length === 0 ? "Спочатку додайте учнів" : undefined}
        loading={homework.loading}
        error={homework.error ?? students.error}
        empty={items.length === 0}
        emptyText="Домашніх завдань ще немає"
      >
        <Stack spacing={1.5}>
          {items.map((item) => (
            <HomeworkCard key={item.id} homework={item} onChanged={homework.reload} />
          ))}
        </Stack>
      </PageSection>
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

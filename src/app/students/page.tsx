"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, List, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import { api, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { AppShell } from "@/components/AppShell";
import { DeleteAction } from "@/components/DeleteAction";
import { IconAction, ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import { toneAt } from "@/components/tones";
import { router } from "../router";
import { DriveFolderAction } from "./DriveFolderAction";
import { StudentDialog } from "./StudentDialog";
import type { Student } from "./types";

export default function StudentsPage() {
  const { data, error, loading, reload } = useApi<Student[]>(
    router.api.students,
    errorMessages.students.loadFailed,
  );
  const [editing, setEditing] = useState<{ student?: Student } | null>(null);
  const students = data ?? [];
  // Math students are grouped by school grade, language students by course level after them.
  const groupKey = (student: Student) =>
    student.siteType === "languages"
      ? `Мови · ${student.languageLevel ?? "без рівня"}`
      : `${student.grade} клас`;
  const groupOrder = (student: Student) =>
    student.siteType === "languages" ? 100 : student.grade;
  const groups = Object.entries(Object.groupBy(students, groupKey)).sort(
    ([firstKey, first], [secondKey, second]) =>
      groupOrder(first![0]) - groupOrder(second![0]) ||
      firstKey.localeCompare(secondKey),
  );

  return (
    <AppShell
      title="Учні"
      subtitle="Навчальні групи та доступ до особистих кабінетів"
      actions={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing({})}
        >
          Додати учня
        </Button>
      }
    >
      <Stack spacing={2}>
        {(loading || error || students.length === 0) && (
          <PageSection
            title="Усі учні"
            loading={loading}
            error={error}
            empty
            emptyText="Поки немає жодного учня"
          />
        )}
        {groups.map(([group, items], index) => (
          <PageSection
            key={group}
            title={group}
            subtitle={`${items?.length} учн.`}
            icon={
              items?.[0]?.siteType === "languages"
                ? (items[0].languageLevel ?? "—")
                : items?.[0]?.grade
            }
            tone={toneAt(index)}
          >
            <List disablePadding>
              {items?.map((student) => (
                <ItemRow
                  key={student.id}
                  tone={toneAt(student.id)}
                  icon={student.name.charAt(0).toUpperCase()}
                  primary={student.name}
                  secondary={`${student.email ?? "без входу"} · ${
                    student.siteType === "languages"
                      ? `Мови: ${student.baseLanguage?.toUpperCase()} → ${student.targetLanguage?.toUpperCase()}${student.languageLevel ? ` · ${student.languageLevel}` : ""}`
                      : "Математика · українська"
                  }`}
                  actions={
                    <Stack direction="row">
                      <IconAction
                        label="Кабінет учня"
                        component={Link}
                        href={router.studentView(student.id)}
                      >
                        <VisibilityIcon />
                      </IconAction>
                      <DriveFolderAction student={student} onChanged={reload} />
                      <IconAction
                        label="Редагувати"
                        color="warning"
                        onClick={() => setEditing({ student })}
                      >
                        <EditIcon />
                      </IconAction>
                      <DeleteAction
                        label={`Видалити: ${student.name}`}
                        message={`${student.name} (${groupKey(student)}) буде видалено.`}
                        onConfirm={async () => {
                          await api(router.api.student(student.id), {
                            method: "DELETE",
                            fallback: errorMessages.students.deleteFailed,
                          });
                          await reload();
                        }}
                      />
                    </Stack>
                  }
                />
              ))}
            </List>
          </PageSection>
        ))}
      </Stack>
      {editing && (
        <StudentDialog
          student={editing.student}
          onSaved={reload}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

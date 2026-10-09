"use client";

import BookIcon from "@mui/icons-material/MenuBookOutlined";
import PracticeIcon from "@mui/icons-material/FitnessCenterOutlined";
import { Stack } from "@mui/material";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { GRADES } from "@/lib/format";
import { AddAction } from "@/components/AddAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { toneAt } from "@/components/tones";
import { router } from "../router";
import type { StudentDashboardData } from "../student/types";

type Textbook = StudentDashboardData["textbooks"][number];

// Grade-wide textbooks and practice links; students see them automatically by grade.
export function TextbookManager() {
  const { data, error, loading, reload } = useApi<Textbook[]>(
    router.api.textbooks,
    errorMessages.textbooks.loadFailed,
  );
  const remove = useAction();
  const textbooks = data ?? [];

  return (
    <Stack spacing={2}>
      <PageSection
        title="Підручники й тренажери"
        subtitle="З'являються в учнів відповідного класу"
        icon={<BookIcon />}
        tone="success"
        loading={loading}
        error={error ?? remove.error}
        action={
          <AddAction
            label="Матеріал"
            color="success"
            title="Новий матеріал"
            fields={[
              { name: "title", label: "Назва", maxLength: 180 },
              {
                name: "grade",
                label: "Клас",
                type: "select",
                options: GRADES.map((value) => [String(value), `${value} клас`]),
                defaultValue: "9",
              },
              { name: "subject", label: "Предмет", defaultValue: "Алгебра", maxLength: 80 },
              { name: "author", label: "Автор або джерело", optional: true, maxLength: 160 },
              {
                name: "resourceType",
                label: "Тип матеріалу",
                type: "select",
                options: [
                  ["textbook", "Підручник"],
                  ["practice", "Тренажер"],
                ],
              },
              { name: "url", label: "Посилання", type: "url" },
            ]}
            onSubmit={async (values) => {
              await api(router.api.textbooks, {
                body: { ...values, grade: Number(values.grade) },
                fallback: errorMessages.textbooks.addFailed,
              });
              await reload();
            }}
          />
        }
        empty={textbooks.length === 0}
        emptyText="Додайте перше посилання на підручник"
      >
        <Stack spacing={2}>
          {GRADES.map((grade) => {
            const items = textbooks.filter((textbook) => textbook.grade === grade);
            return (
              items.length > 0 && (
                <PageSection
                  key={grade}
                  title={`${grade} клас`}
                  icon={grade}
                  tone={toneAt(grade)}
                  flat
                >
                  <LinkList
                    busy={remove.busy}
                    items={items.map((item) => ({
                      id: item.id,
                      name: item.title,
                      url: item.url,
                      icon: item.resourceType === "practice" ? <PracticeIcon /> : <BookIcon />,
                      tone: item.resourceType === "practice" ? "secondary" : "primary",
                      secondary: [item.subject, item.author, item.isDemo ? "демо" : ""]
                        .filter(Boolean)
                        .join(" · "),
                    }))}
                    onDelete={async (id) => {
                      const deleted = await remove.run(() =>
                        api(router.api.textbook(Number(id)), {
                          method: "DELETE",
                          fallback: errorMessages.textbooks.deleteFailed,
                        }),
                      );
                      if (deleted) await reload();
                    }}
                  />
                </PageSection>
              )
            );
          })}
        </Stack>
      </PageSection>
    </Stack>
  );
}

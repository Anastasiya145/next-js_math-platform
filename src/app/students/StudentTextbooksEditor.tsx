"use client";

import BookIcon from "@mui/icons-material/MenuBookOutlined";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import type { PersonalStudentTextbook } from "@/lib/db";
import { AddAction } from "@/components/AddAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";

// Teacher-only: textbooks visible to one student on top of the grade-wide ones.
export function StudentTextbooksEditor({ studentId }: { studentId: number }) {
  const url = router.api.studentTextbooks(studentId);
  const { data, error, loading, reload } = useApi<PersonalStudentTextbook[]>(
    url,
    errorMessages.textbooks.loadFailed,
  );
  const remove = useAction();
  const textbooks = data ?? [];

  return (
    <PageSection
      title="Персональні підручники"
      subtitle="Лише для цього учня"
      icon={<BookIcon />}
      tone="info"
      action={
        <AddAction
          label="Додати"
          color="info"
          title="Новий підручник"
          fields={[
            { name: "title", label: "Назва підручника" },
            { name: "subject", label: "Предмет", optional: true },
            { name: "url", label: "Посилання", type: "url" },
          ]}
          onSubmit={async (body) => {
            await api(url, { body, fallback: errorMessages.textbooks.addFailed });
            await reload();
          }}
        />
      }
      loading={loading}
      error={error ?? remove.error}
      empty={textbooks.length === 0}
      emptyText="Поки немає підручників"
    >
      <LinkList
        busy={remove.busy}
        items={textbooks.map((item) => ({
          id: item.id,
          name: item.title,
          url: item.url,
          secondary: item.subject,
          icon: <BookIcon />,
          tone: "info",
        }))}
        onDelete={async (id) => {
          const deleted = await remove.run(() =>
            api(`${url}?textbookId=${id}`, {
              method: "DELETE",
              fallback: errorMessages.textbooks.deleteFailed,
            }),
          );
          if (deleted) await reload();
        }}
      />
    </PageSection>
  );
}

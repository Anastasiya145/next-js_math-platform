"use client";

import { List } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import StyleIcon from "@mui/icons-material/StyleOutlined";
import { ApiError, api, useAction } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { parseWordList, type LanguageWord } from "@/lib/language-course";
import { AddAction } from "@/components/AddAction";
import { IconAction, ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";

// Teacher-managed vocabulary of a course topic; students study it as flashcards.
export function TopicWords({
  topicId,
  words,
  onChanged,
}: {
  topicId: number;
  words: LanguageWord[];
  onChanged: () => Promise<unknown>;
}) {
  const remove = useAction();

  return (
    <PageSection
      title="Слова для вивчення"
      subtitle={words.length ? `${words.length} сл.` : undefined}
      flat
      tone="info"
      error={remove.error}
      empty={words.length === 0}
      emptyText="Додайте слова — учень вивчатиме їх як картки"
      action={
        <AddAction
          label="Слова"
          color="info"
          title="Додати слова"
          fields={[
            {
              name: "words",
              label:
                "По одному на рядок: слово — переклад — приклад (необов'язково)",
              type: "multiline",
              maxLength: 40000,
            },
          ]}
          onSubmit={async ({ words: text }) => {
            const parsed = parseWordList(text);
            if (!parsed)
              throw new ApiError(errorMessages.languageCourse.invalidWords);
            await api(router.api.languageTopics, {
              body: { action: "add-words", topicId, words: parsed },
              fallback: errorMessages.languageCourse.saveFailed,
            });
            await onChanged();
          }}
        />
      }
    >
      <List disablePadding dense>
        {words.map((word) => (
          <ItemRow
            key={word.id}
            tone="info"
            icon={<StyleIcon />}
            primary={`${word.term} — ${word.translation}`}
            secondary={word.example || undefined}
            actions={
              <IconAction
                label={`Видалити: ${word.term}`}
                color="error"
                disabled={remove.busy}
                onClick={async () => {
                  if (
                    await remove.run(() =>
                      api(router.api.languageTopics, {
                        body: { action: "delete-word", wordId: word.id },
                        fallback: errorMessages.languageCourse.deleteFailed,
                      }),
                    )
                  )
                    await onChanged();
                }}
              >
                <DeleteIcon />
              </IconAction>
            }
          />
        ))}
      </List>
    </PageSection>
  );
}

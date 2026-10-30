"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TranslateIcon from "@mui/icons-material/Translate";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import {
  LANGUAGE_LEVELS,
  LANGUAGE_NAMES,
  LANGUAGE_SECTIONS,
  LANGUAGE_SECTION_LABELS,
  type LanguageLevel,
  type LanguageTopic,
} from "@/lib/language-course";
import type { LanguageCode } from "@/lib/languages";
import type { FieldSpec } from "@/components/FieldsDialog";
import { ActionRow } from "@/components/ActionRow";
import { AddAction } from "@/components/AddAction";
import { DeleteAction } from "@/components/DeleteAction";
import { EditAction } from "@/components/EditAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { toneAt } from "@/components/tones";
import { router } from "../router";
import { AssignHomeworkAction } from "../homework/AssignHomeworkAction";
import { TopicWords } from "./TopicWords";

const post = (body: Record<string, unknown>, fallback: string) =>
  api(router.api.languageTopics, { body, fallback });

const topicFields = (
  topic?: LanguageTopic,
  level?: LanguageLevel,
): FieldSpec[] => [
  {
    name: "title",
    label: "Назва теми",
    maxLength: 160,
    defaultValue: topic?.title,
  },
  {
    name: "section",
    label: "Розділ",
    type: "select",
    options: LANGUAGE_SECTIONS.map((value) => [
      value,
      LANGUAGE_SECTION_LABELS[value],
    ]),
    defaultValue: topic?.section ?? "grammar",
  },
  {
    name: "level",
    label: "Рівень",
    type: "select",
    options: LANGUAGE_LEVELS.map((value) => [value, value]),
    defaultValue: topic?.level ?? level,
  },
  {
    name: "description",
    label: "Опис",
    type: "multiline",
    optional: true,
    maxLength: 2000,
    defaultValue: topic?.description,
  },
];

const materialFields = (material?: {
  name: string;
  url: string;
}): FieldSpec[] => [
  {
    name: "name",
    label: "Назва",
    maxLength: 160,
    defaultValue: material?.name,
  },
  { name: "url", label: "Посилання", type: "url", defaultValue: material?.url },
];

function TopicItem({
  topic,
  onChanged,
}: {
  topic: LanguageTopic;
  onChanged: () => Promise<unknown>;
}) {
  const remove = useAction();

  return (
    <ActionRow
      action={
        <>
          <AssignHomeworkAction
            title={topic.title}
            url=""
            languageTopicId={topic.id}
          />
          <EditAction
            label={`Редагувати тему: ${topic.title}`}
            title="Редагувати тему"
            fields={topicFields(topic)}
            onSubmit={async (values) => {
              await post(
                { action: "update-topic", topicId: topic.id, ...values },
                errorMessages.languageCourse.saveFailed,
              );
              await onChanged();
            }}
          />
          <DeleteAction
            label={`Видалити тему: ${topic.title}`}
            message={`Тему «${topic.title}» разом з матеріалами буде видалено. Уроки й ДЗ залишаться без теми.`}
            onConfirm={async () => {
              await post(
                { action: "delete-topic", topicId: topic.id },
                errorMessages.languageCourse.deleteFailed,
              );
              await onChanged();
            }}
          />
        </>
      }
    >
      <Accordion
        disableGutters
        variant="outlined"
        slotProps={{ transition: { unmountOnExit: true } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography sx={{ fontWeight: 600 }}>{topic.title}</Typography>
              {topic.materials.length > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${topic.materials.length} мат.`}
                />
              )}
              {topic.words.length > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="info"
                  label={`${topic.words.length} сл.`}
                />
              )}
            </Stack>
            {topic.description && (
              <Typography variant="body2" color="text.secondary">
                {topic.description}
              </Typography>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <PageSection
            title="Матеріали"
            flat
            tone="secondary"
            error={remove.error}
            empty={topic.materials.length === 0}
            emptyText="Поки немає матеріалів"
            action={
              <AddAction
                label="Матеріал"
                color="secondary"
                title="Новий матеріал"
                fields={materialFields()}
                onSubmit={async (values) => {
                  await post(
                    { action: "add-material", topicId: topic.id, ...values },
                    errorMessages.languageCourse.saveFailed,
                  );
                  await onChanged();
                }}
              />
            }
          >
            <LinkList
              busy={remove.busy}
              items={topic.materials.map((material) => ({
                id: material.id,
                name: material.name,
                url: material.url,
                extra: (
                  <AssignHomeworkAction
                    title={material.name}
                    url={material.url}
                    languageTopicId={topic.id}
                  />
                ),
                edit: (
                  <EditAction
                    label={`Редагувати: ${material.name}`}
                    title="Редагувати матеріал"
                    fields={materialFields(material)}
                    onSubmit={async (values) => {
                      await post(
                        {
                          action: "update-material",
                          materialId: material.id,
                          ...values,
                        },
                        errorMessages.languageCourse.saveFailed,
                      );
                      await onChanged();
                    }}
                  />
                ),
              }))}
              onDelete={async (id) => {
                if (
                  await remove.run(() =>
                    post(
                      { action: "delete-material", materialId: id },
                      errorMessages.languageCourse.deleteFailed,
                    ),
                  )
                )
                  await onChanged();
              }}
            />
          </PageSection>
          <TopicWords
            topicId={topic.id}
            words={topic.words}
            onChanged={onChanged}
          />
        </AccordionDetails>
      </Accordion>
    </ActionRow>
  );
}

// Teacher-managed language course: topics by level and section, each with its materials.
export function LanguageTopicsManager() {
  const [language, setLanguage] = useState<LanguageCode>("ru");
  const [level, setLevel] = useState<LanguageLevel>("A1");
  const { data, error, loading, reload } = useApi<LanguageTopic[]>(
    `${router.api.languageTopics}?language=${language}`,
    errorMessages.languageCourse.loadFailed,
  );
  const topics = (data ?? []).filter((topic) => topic.level === level);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={language}
          onChange={(_, value: LanguageCode | null) =>
            value && setLanguage(value)
          }
          aria-label="Мова курсу"
        >
          {(["ru", "fr"] as const).map((value) => (
            <ToggleButton key={value} value={value}>
              {LANGUAGE_NAMES[value]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="secondary"
          value={level}
          onChange={(_, value: LanguageLevel | null) =>
            value && setLevel(value)
          }
          aria-label="Рівень"
        >
          {LANGUAGE_LEVELS.map((value) => (
            <ToggleButton key={value} value={value}>
              {value}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <PageSection
        title={`${LANGUAGE_NAMES[language]} · ${level}`}
        subtitle={`${topics.length} тем`}
        icon={<TranslateIcon />}
        tone="info"
        loading={loading}
        error={error}
        empty={topics.length === 0}
        emptyText="Для цього рівня ще немає тем"
        action={
          <AddAction
            label="Тема"
            color="info"
            title="Нова тема"
            fields={topicFields(undefined, level)}
            onSubmit={async (values) => {
              await post(
                { action: "create-topic", language, ...values },
                errorMessages.languageCourse.saveFailed,
              );
              await reload();
            }}
          />
        }
      >
        <Stack spacing={2}>
          {LANGUAGE_SECTIONS.map((section, index) => {
            const items = topics.filter((topic) => topic.section === section);
            if (items.length === 0) return null;
            return (
              <Stack key={section} spacing={1.5}>
                <Typography
                  component="h3"
                  variant="subtitle2"
                  sx={{ color: `${toneAt(index)}.main`, fontWeight: 700 }}
                >
                  {LANGUAGE_SECTION_LABELS[section]}
                </Typography>
                {items.map((topic) => (
                  <TopicItem key={topic.id} topic={topic} onChanged={reload} />
                ))}
              </Stack>
            );
          })}
        </Stack>
      </PageSection>
    </Stack>
  );
}

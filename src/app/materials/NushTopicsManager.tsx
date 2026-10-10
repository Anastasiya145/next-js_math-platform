"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Chip,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/SchoolOutlined";
import TopicIcon from "@mui/icons-material/TopicOutlined";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { GRADES } from "@/lib/format";
import {
  NUSH_SPLIT_GRADE,
  NUSH_SPLIT_SUBJECTS,
  NUSH_SUBJECT_LABELS,
  type NushSubject,
} from "@/lib/nush";
import type { NushTopic, NushTopicMaterial } from "@/lib/db";
import { ActionRow } from "@/components/ActionRow";
import { AddAction } from "@/components/AddAction";
import { DeleteAction } from "@/components/DeleteAction";
import { EditAction } from "@/components/EditAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { shade, tint, toneAt, type Tone } from "@/components/tones";
import { router } from "../router";
import { AssignHomeworkAction } from "../homework/AssignHomeworkAction";

const MATERIAL_TYPES: Array<[NushTopicMaterial["materialType"], string, Tone]> = [
  ["google_drive", "Google Диск", "success"],
  ["naurok", "Наурок", "warning"],
  ["pdf", "PDF", "error"],
  ["doc", "Документ", "info"],
  ["link", "Посилання", "primary"],
  ["other", "Інше", "secondary"],
];

const postNush = (body: Record<string, unknown>) =>
  api(router.api.nush, { body, fallback: errorMessages.materials.actionFailed });

const saveNush = (body: Record<string, unknown>) =>
  api(router.api.nush, { body, fallback: errorMessages.materials.saveFailed });

const subjectField = (defaultValue: NushSubject) => ({
  name: "subject",
  label: "Розділ",
  type: "select" as const,
  options: NUSH_SPLIT_SUBJECTS.map((value): [string, string] => [
    value,
    NUSH_SUBJECT_LABELS[value],
  ]),
  defaultValue,
});

function TopicMaterials({ grade, topicId }: { grade: number; topicId: number }) {
  const { data, error, loading, reload } = useApi<NushTopicMaterial[]>(
    `${router.api.nush}?grade=${grade}&topicId=${topicId}`,
    errorMessages.materials.loadFailed,
  );
  const remove = useAction();
  const materials = data ?? [];

  return (
    <PageSection
      title="Матеріали"
      flat
      tone="secondary"
      loading={loading}
      error={error ?? remove.error}
      empty={materials.length === 0}
      emptyText="Поки немає матеріалів"
      action={
        <AddAction
          label="Матеріал"
          color="secondary"
          title="Новий матеріал"
          fields={[
            { name: "name", label: "Назва", maxLength: 160 },
            { name: "url", label: "Посилання", type: "url" },
            {
              name: "materialType",
              label: "Тип",
              type: "select",
              options: MATERIAL_TYPES.map(([value, label]) => [value, label]),
              defaultValue: "link",
            },
          ]}
          onSubmit={async ({ name, url, materialType }) => {
            await postNush({
              action: "add-material",
              topicId,
              material: { name, url, materialType },
            });
            await reload();
          }}
        />
      }
    >
      <LinkList
        busy={remove.busy}
        items={materials.map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          secondary: MATERIAL_TYPES.find(([type]) => type === item.materialType)?.[1],
          tone: MATERIAL_TYPES.find(([type]) => type === item.materialType)?.[2],
          extra: <AssignHomeworkAction title={item.name} url={item.url} />,
          edit: (
            <EditAction
              label={`Редагувати: ${item.name}`}
              title="Редагувати матеріал"
              fields={[
                { name: "name", label: "Назва", maxLength: 160, defaultValue: item.name },
                { name: "url", label: "Посилання", type: "url", defaultValue: item.url },
                {
                  name: "materialType",
                  label: "Тип",
                  type: "select",
                  options: MATERIAL_TYPES.map(([value, label]) => [value, label]),
                  defaultValue: item.materialType,
                },
              ]}
              onSubmit={async ({ name, url, materialType }) => {
                await saveNush({
                  action: "update-material",
                  materialId: item.id,
                  material: { name, url, materialType },
                });
                await reload();
              }}
            />
          ),
        }))}
        onDelete={async (id) => {
          if (await remove.run(() => postNush({ action: "delete-material", materialId: id })))
            await reload();
        }}
      />
    </PageSection>
  );
}

function GradeTopics({ grade }: { grade: number }) {
  const { data, error, loading, reload } = useApi<NushTopic[]>(
    `${router.api.nush}?grade=${grade}`,
    errorMessages.materials.loadFailed,
  );
  const [subject, setSubject] = useState<NushSubject>("algebra");
  const allTopics = data ?? [];
  const split = grade >= NUSH_SPLIT_GRADE;
  const topics = split ? allTopics.filter((topic) => topic.subject === subject) : allTopics;
  const tone = toneAt(grade);

  return (
    <Stack spacing={2}>
      {split && (
        <Tabs
          value={subject}
          onChange={(_, value: NushSubject) => setSubject(value)}
          aria-label="Розділ програми"
        >
          {NUSH_SPLIT_SUBJECTS.map((value) => (
            <Tab
              key={value}
              value={value}
              label={
                <Stack component="span" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <span>{NUSH_SUBJECT_LABELS[value]}</span>
                  <Chip
                    size="small"
                    color={allTopics.some((topic) => topic.subject === value) ? tone : "default"}
                    label={allTopics.filter((topic) => topic.subject === value).length}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      )}
      <PageSection
        title={split ? `${NUSH_SUBJECT_LABELS[subject]}, ${grade} клас` : `Теми ${grade} класу`}
        icon={<SchoolIcon />}
        tone={tone}
        loading={loading}
        error={error}
        empty={topics.length === 0}
        emptyText={split ? "Для цього розділу ще немає тем" : "Для цього класу ще немає тем"}
        action={
          <AddAction
            label="Тема"
            color={tone}
            title="Нова тема"
            fields={[
              { name: "title", label: "Назва теми", maxLength: 160 },
              { name: "description", label: "Опис", type: "multiline", optional: true },
              ...(split ? [subjectField(subject)] : []),
            ]}
            onSubmit={async (values) => {
              await postNush({ action: "create-topic", grade, ...values });
              await reload();
            }}
          />
        }
      >
        <Stack spacing={1.5}>
          {topics.map((topic, index) => (
            <ActionRow
              key={topic.id}
              action={
                <>
                  <EditAction
                    label={`Редагувати тему: ${topic.title}`}
                    title="Редагувати тему"
                    fields={[
                      {
                        name: "title",
                        label: "Назва теми",
                        maxLength: 160,
                        defaultValue: topic.title,
                      },
                      {
                        name: "description",
                        label: "Опис",
                        type: "multiline",
                        optional: true,
                        defaultValue: topic.description,
                      },
                      ...(split ? [subjectField(topic.subject)] : []),
                    ]}
                    onSubmit={async (values) => {
                      await saveNush({ action: "update-topic", topicId: topic.id, ...values });
                      await reload();
                    }}
                  />
                  <DeleteAction
                    label={`Видалити тему: ${topic.title}`}
                    message={`Тему «${topic.title}» разом з усіма матеріалами буде видалено.`}
                    onConfirm={async () => {
                      await api(router.api.nush, {
                        body: { action: "delete-topic", topicId: topic.id },
                        fallback: errorMessages.materials.deleteFailed,
                      });
                      await reload();
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
                  <Avatar
                    variant="rounded"
                    sx={{
                      mr: 1.5,
                      alignSelf: "center",
                      bgcolor: tint(toneAt(index), 16),
                      color: shade(toneAt(index)),
                    }}
                  >
                    <TopicIcon />
                  </Avatar>
                  <Stack>
                    <Typography sx={{ fontWeight: 600 }}>{topic.title}</Typography>
                    {topic.description && (
                      <Typography variant="body2" color="text.secondary">
                        {topic.description}
                      </Typography>
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TopicMaterials grade={grade} topicId={topic.id} />
                </AccordionDetails>
              </Accordion>
            </ActionRow>
          ))}
        </Stack>
      </PageSection>
    </Stack>
  );
}

export function NushTopicsManager() {
  const [grade, setGrade] = useState(1);

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        value={grade}
        onChange={(_, value: number | null) => value && setGrade(value)}
        aria-label="Клас"
        sx={{ flexWrap: "wrap" }}
      >
        {GRADES.map((value) => (
          <ToggleButton key={value} value={value} aria-label={`${value} клас`}>
            {value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <GradeTopics key={grade} grade={grade} />
    </Stack>
  );
}

"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Stack,
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
import type { NushTopic, NushTopicMaterial } from "@/lib/db";
import { ActionRow } from "@/components/ActionRow";
import { AddAction } from "@/components/AddAction";
import { DeleteAction } from "@/components/DeleteAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { shade, tint, toneAt, type Tone } from "@/components/tones";
import { router } from "../router";

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
  const topics = data ?? [];

  return (
    <PageSection
      title={`Теми ${grade} класу`}
      icon={<SchoolIcon />}
      tone={toneAt(grade)}
      loading={loading}
      error={error}
      empty={topics.length === 0}
      emptyText="Для цього класу ще немає тем"
      action={
        <AddAction
          label="Тема"
          color={toneAt(grade)}
          title="Нова тема"
          fields={[
            { name: "title", label: "Назва теми", maxLength: 160 },
            { name: "description", label: "Опис", type: "multiline", optional: true },
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

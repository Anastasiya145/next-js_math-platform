"use client";

import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import FolderSharedIcon from "@mui/icons-material/FolderSharedOutlined";
import ImageIcon from "@mui/icons-material/ImageOutlined";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import PdfIcon from "@mui/icons-material/PictureAsPdfOutlined";
import FileIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { ActionRow } from "@/components/ActionRow";
import { AddAction } from "@/components/AddAction";
import { DeleteAction } from "@/components/DeleteAction";
import { LinkList } from "@/components/LinkList";
import { PageSection } from "@/components/PageSection";
import { shade, toneAt, type Tone } from "@/components/tones";
import { router } from "../router";

type FileType = "pdf" | "doc" | "image" | "link" | "other";
type ClassFolder = {
  id: number;
  className: string;
  driveFolderUrl: string;
  topics: {
    id: number;
    title: string;
    files: { id: number; name: string; url: string; type: FileType; addedAt: string }[];
  }[];
};

const FILE_TYPES: Array<[FileType, string, ReactNode, Tone]> = [
  ["pdf", "PDF", <PdfIcon key="pdf" />, "error"],
  ["doc", "Документ", <DescriptionIcon key="doc" />, "info"],
  ["image", "Зображення", <ImageIcon key="image" />, "success"],
  ["link", "Посилання", <LinkIcon key="link" />, "primary"],
  ["other", "Інше", <FileIcon key="other" />, "warning"],
];

export function ClassMaterials() {
  const { data, error, loading, reload } = useApi<ClassFolder[]>(
    router.api.materials,
    errorMessages.materials.loadFailed,
  );
  const fileRemoval = useAction();
  const [classId, setClassId] = useState<number | null>(null);
  const classes = data ?? [];
  const current = classes.find((item) => item.id === classId) ?? classes[0];

  const post = async (
    body: Record<string, unknown>,
    fallback: string = errorMessages.materials.actionFailed,
  ) => {
    await api(router.api.materials, { body, fallback });
    await reload();
  };

  const remove = (body: Record<string, unknown>) =>
    post(body, errorMessages.materials.deleteFailed);

  return (
    <PageSection
      title="Класи й теми"
      subtitle="Файли та посилання, згруповані за класами й темами"
      icon={<FolderSharedIcon />}
      tone="info"
      action={
        <AddAction
          label="Клас"
          color="info"
          title="Новий клас"
          fields={[{ name: "className", label: "Назва класу, напр. 8 клас", maxLength: 80 }]}
          onSubmit={(values) => post({ action: "add-class", ...values })}
        />
      }
      loading={loading}
      error={error ?? fileRemoval.error}
      empty={classes.length === 0}
      emptyText="Додайте перший клас"
    >
      <Tabs
        value={current?.id ?? false}
        onChange={(_, value: number) => setClassId(value)}
        variant="scrollable"
        sx={{ mb: 2 }}
      >
        {classes.map((item) => (
          <Tab key={item.id} value={item.id} label={`${item.className} · ${item.topics.length}`} />
        ))}
      </Tabs>
      {current && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <AddAction
              label="Тема"
              color="info"
              title="Нова тема"
              fields={[{ name: "topicTitle", label: "Назва теми, напр. Відсотки", maxLength: 120 }]}
              onSubmit={(values) => post({ action: "add-topic", classId: current.id, ...values })}
            />
            <AddAction
              key={current.id}
              label="Папка Google Диск"
              variant="outlined"
              color="success"
              icon={<FolderIcon />}
              fields={[
                {
                  name: "driveFolderUrl",
                  label: "Посилання на папку",
                  type: "url",
                  optional: true,
                  defaultValue: current.driveFolderUrl,
                },
              ]}
              submitLabel="Зберегти"
              onSubmit={(values) =>
                post({ action: "set-drive-folder", classId: current.id, ...values })
              }
            />
            {current.driveFolderUrl && (
              <Button
                variant="outlined"
                color="success"
                href={current.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Відкрити папку
              </Button>
            )}
            <DeleteAction
              key={`delete-${current.id}`}
              label={`Видалити клас: ${current.className}`}
              message={`Клас «${current.className}» разом з усіма темами та файлами буде видалено.`}
              onConfirm={() => remove({ action: "delete-class", classId: current.id })}
            />
          </Stack>
          {current.topics.length === 0 && (
            <Typography color="text.secondary">Поки немає тем</Typography>
          )}
          {current.topics.map((topic, index) => (
            <ActionRow
              key={topic.id}
              action={
                <DeleteAction
                  label={`Видалити тему: ${topic.title}`}
                  message={`Тему «${topic.title}» разом з усіма файлами буде видалено.`}
                  onConfirm={() =>
                    remove({ action: "delete-topic", classId: current.id, topicId: topic.id })
                  }
                />
              }
            >
              <Accordion
                disableGutters
                variant="outlined"
                sx={{ borderLeft: `6px solid ${shade(toneAt(index))}` }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{topic.title}</Typography>
                  <Chip
                    size="small"
                    color={toneAt(index)}
                    label={topic.files.length}
                    sx={{ ml: 1 }}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <LinkList
                    items={topic.files.map((file) => ({
                      id: file.id,
                      name: file.name,
                      url: file.url,
                      secondary: `Додано ${file.addedAt}`,
                      icon: FILE_TYPES.find(([type]) => type === file.type)?.[2],
                      tone: FILE_TYPES.find(([type]) => type === file.type)?.[3],
                    }))}
                    busy={fileRemoval.busy}
                    onDelete={(fileId) =>
                      void fileRemoval.run(() =>
                        remove({
                          action: "delete-file",
                          classId: current.id,
                          topicId: topic.id,
                          fileId,
                        }),
                      )
                    }
                  />
                  <Stack direction="row" sx={{ mt: 1.5 }}>
                    <AddAction
                      label="Файл"
                      color={toneAt(index)}
                      title="Новий файл"
                      fields={[
                        { name: "name", label: "Назва файлу", maxLength: 160 },
                        { name: "url", label: "Посилання (Google Диск тощо)", type: "url" },
                        {
                          name: "type",
                          label: "Тип",
                          type: "select",
                          options: FILE_TYPES.map(([value, label]) => [value, label]),
                        },
                      ]}
                      onSubmit={({ name, url, type }) =>
                        post({
                          action: "add-file",
                          classId: current.id,
                          topicId: topic.id,
                          file: { name, url, type },
                        })
                      }
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </ActionRow>
          ))}
        </Stack>
      )}
    </PageSection>
  );
}

"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  List,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StyleIcon from "@mui/icons-material/StyleOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import { IconAction, ItemRow } from "@/components/ItemRow";
import { PageSection } from "@/components/PageSection";
import {
  LANGUAGE_SECTIONS,
  type LanguageLevel,
  type LanguageSection,
  type StudentCourseTopic,
} from "@/lib/language-course";
import type { TranslationKey } from "@/lib/language-messages";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { WordTrainer } from "./WordTrainer";

const SECTION_KEYS: Record<LanguageSection, TranslationKey> = {
  grammar: "sectionGrammar",
  vocabulary: "sectionVocabulary",
  phonetics: "sectionPhonetics",
  reading: "sectionReading",
  speaking: "sectionSpeaking",
};

function CourseTopic({ topic }: { topic: StudentCourseTopic }) {
  const { t } = useAppLanguage();
  const [training, setTraining] = useState(false);
  return (
    <Accordion
      disableGutters
      variant="outlined"
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Typography sx={{ fontWeight: 600 }}>{topic.title}</Typography>
          <Chip
            size="small"
            color={topic.studied ? "success" : "default"}
            variant={topic.studied ? "filled" : "outlined"}
            icon={topic.studied ? <CheckCircleIcon /> : undefined}
            label={t(topic.studied ? "topicStudied" : "topicUpcoming")}
          />
          {topic.homeworkCount > 0 && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={t("topicHomework", { count: topic.homeworkCount })}
            />
          )}
          {topic.words.length > 0 && (
            <Chip
              size="small"
              color="info"
              variant="outlined"
              icon={<StyleIcon />}
              label={t("wordsCount", { count: topic.words.length })}
            />
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {topic.words.length > 0 && (
            <Button
              variant="contained"
              color="info"
              startIcon={<StyleIcon />}
              onClick={() => setTraining(true)}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("learnWords", { count: topic.words.length })}
            </Button>
          )}
          {training && (
            <WordTrainer
              title={topic.title}
              words={topic.words}
              onClose={() => setTraining(false)}
            />
          )}
          {topic.description && (
            <Typography variant="body2" color="text.secondary">
              {topic.description}
            </Typography>
          )}
          {topic.materials.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("topicMaterialsEmpty")}
            </Typography>
          ) : (
            <List disablePadding>
              {topic.materials.map((material) => (
                <ItemRow
                  key={material.id}
                  icon={<LinkIcon />}
                  primary={material.name}
                  actions={
                    <IconAction
                      label={t("openResource", { title: material.name })}
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon />
                    </IconAction>
                  }
                />
              ))}
            </List>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// The language student's course: topics of their level grouped by section, with materials and progress.
export function StudentCourse({
  topics,
  level,
}: {
  topics: StudentCourseTopic[];
  level: LanguageLevel | null;
}) {
  const { t } = useAppLanguage();
  const studied = topics.filter((topic) => topic.studied).length;

  return (
    <PageSection
      title={t("myCourse")}
      subtitle={[
        level && t("levelLabel", { level }),
        topics.length > 0 &&
          t("courseProgress", { done: studied, total: topics.length }),
      ]
        .filter(Boolean)
        .join(" · ")}
      icon={<TranslateIcon />}
      tone="success"
      empty={topics.length === 0}
      emptyText={t("courseEmpty")}
    >
      <Stack spacing={2}>
        {LANGUAGE_SECTIONS.map((section) => {
          const items = topics.filter((topic) => topic.section === section);
          if (items.length === 0) return null;
          return (
            <Stack key={section} spacing={1}>
              <Typography
                component="h3"
                variant="subtitle2"
                color="text.secondary"
              >
                {t(SECTION_KEYS[section])}
              </Typography>
              {items.map((topic) => (
                <CourseTopic key={topic.id} topic={topic} />
              ))}
            </Stack>
          );
        })}
      </Stack>
    </PageSection>
  );
}

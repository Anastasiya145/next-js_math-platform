"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import type { StudentProgressPoint } from "@/lib/db";
import { PageSection } from "./PageSection";
import { shade } from "./tones";
import { useAppLanguage } from "@/lib/LanguageProvider";

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));

export function ProgressChart({
  studentName,
  points,
}: {
  studentName: string;
  points: StudentProgressPoint[];
}) {
  const { locale, t } = useAppLanguage();
  const intlLocale =
    locale === "fr" ? "fr-FR" : locale === "ru" ? "ru-RU" : "uk-UA";
  const graded = points.filter(
    (point) => point.gradedAt !== null && point.score !== null,
  );
  const average = graded.length
    ? graded.reduce((sum, point) => sum + (point.score ?? 0), 0) / graded.length
    : null;

  return (
    <PageSection
      title={t("resultTrend")}
      icon={<ShowChartIcon />}
      tone="secondary"
      subtitle={
        average === null
          ? undefined
          : t("averageGrade", {
              average: new Intl.NumberFormat(locale, {
                maximumFractionDigits: 1,
              }).format(average),
            })
      }
      empty={graded.length === 0}
      emptyText={t("chartEmpty")}
    >
      <LineChart
        height={280}
        hideLegend
        aria-label={t("progressFor", { name: studentName })}
        xAxis={[
          {
            scaleType: "point",
            data: graded.map((point) => formatDate(point.lessonAt, intlLocale)),
          },
        ]}
        yAxis={[{ min: 0, max: 12 }]}
        series={[
          {
            data: graded.map((point) => point.score),
            label: t("score"),
            showMark: true,
            area: true,
            curve: "monotoneX",
            color: shade("secondary"),
          },
        ]}
      />
      <Accordion disableGutters variant="outlined" sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{t("showScores")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("date")}</TableCell>
                <TableCell>{t("homeworkLabel")}</TableCell>
                <TableCell>{t("result")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {points.map((point) => (
                <TableRow key={`${point.homeworkId}-${point.lessonAt}`}>
                  <TableCell>
                    {formatDate(point.lessonAt, intlLocale)}
                  </TableCell>
                  <TableCell>{point.title}</TableCell>
                  <TableCell>
                    {point.score === null
                      ? t("waitingGrade")
                      : `${point.score}/12${point.status === "no_homework" ? ` · ${t("noHomeworkShort")}` : ""}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </PageSection>
  );
}

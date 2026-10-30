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
import { LineChart, lineClasses } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import type { StudentProgressPoint } from "@/lib/db";
import { PageSection } from "./PageSection";
import { shade, tint } from "./tones";
import { useAppLanguage } from "@/lib/LanguageProvider";

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));

const formatShortDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
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
        height={260}
        hideLegend
        grid={{ horizontal: true }}
        margin={{ left: 0, right: 16 }}
        aria-label={t("progressFor", { name: studentName })}
        xAxis={[
          {
            scaleType: "point",
            data: graded.map((point) => point.lessonAt),
            // Short dates on the axis, the full date in the tooltip.
            valueFormatter: (value: string, context) =>
              context.location === "tick"
                ? formatShortDate(value, intlLocale)
                : formatDate(value, intlLocale),
            disableTicks: true,
            disableLine: true,
            tickLabelStyle: { fontSize: 12 },
          },
        ]}
        yAxis={[
          {
            min: 0,
            max: 12,
            tickInterval: [0, 3, 6, 9, 12],
            disableTicks: true,
            disableLine: true,
            width: 32,
          },
        ]}
        series={[
          {
            data: graded.map((point) => point.score),
            label: t("score"),
            valueFormatter: (value) => (value === null ? "" : `${value}/12`),
            showMark: true,
            area: true,
            curve: "monotoneX",
            color: shade("secondary"),
          },
        ]}
        sx={{
          [`& .${lineClasses.area}`]: { fill: tint("secondary", 12) },
          [`& .${lineClasses.line}`]: { strokeWidth: 2.5 },
          [`& .${lineClasses.mark}`]: { strokeWidth: 2, r: 4 },
          "& .MuiChartsGrid-line": {
            stroke: "var(--mui-palette-divider)",
            strokeDasharray: "4 4",
          },
        }}
      >
        {average !== null && (
          <ChartsReferenceLine
            y={average}
            lineStyle={{
              stroke: "var(--mui-palette-text-secondary)",
              strokeDasharray: "6 4",
              strokeWidth: 1,
            }}
          />
        )}
      </LineChart>
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

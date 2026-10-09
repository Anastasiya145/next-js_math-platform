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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "2-digit" }).format(
    new Date(value),
  );

export function ProgressChart({
  studentName,
  points,
}: {
  studentName: string;
  points: StudentProgressPoint[];
}) {
  const graded = points.filter((point) => point.gradedAt !== null && point.score !== null);
  const average = graded.length
    ? graded.reduce((sum, point) => sum + (point.score ?? 0), 0) / graded.length
    : null;

  return (
    <PageSection
      title="Динаміка результатів"
      icon={<ShowChartIcon />}
      tone="secondary"
      subtitle={average === null ? undefined : `Середня оцінка ${average.toFixed(1)}/12`}
      empty={graded.length === 0}
      emptyText="Графік з'явиться після перевірки першої домашньої роботи."
    >
      <LineChart
        height={280}
        hideLegend
        aria-label={`Прогрес: ${studentName}`}
        xAxis={[{ scaleType: "point", data: graded.map((point) => formatDate(point.submittedAt)) }]}
        yAxis={[{ min: 0, max: 12 }]}
        series={[
          {
            data: graded.map((point) => point.score),
            label: "Оцінка (0–12)",
            showMark: true,
            area: true,
            curve: "monotoneX",
            color: shade("secondary"),
          },
        ]}
      />
      <Accordion disableGutters variant="outlined" sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Показати оцінки списком</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Домашня робота</TableCell>
                <TableCell>Результат</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {points.map((point) => (
                <TableRow key={`${point.homeworkId}-${point.submittedAt}`}>
                  <TableCell>{formatDate(point.submittedAt)}</TableCell>
                  <TableCell>{point.title}</TableCell>
                  <TableCell>
                    {point.score === null
                      ? "Очікує перевірки"
                      : `${point.score}/12${point.status === "no_homework" ? " · Немає ДЗ" : ""}`}
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

import "server-only";
import pdfmake from "pdfmake";
import vfs from "pdfmake/build/vfs_fonts";
import type { Content, CustomTableLayout, TableCell } from "pdfmake/interfaces";
import { formatDate, formatHours, lessonTimeRange } from "@/lib/format";
import {
  NUSH_SPLIT_SUBJECTS,
  NUSH_SUBJECT_LABELS,
  formatTopic,
  type NushSubject,
} from "@/lib/nush";
import type { ReportLesson, StudentReport } from "@/lib/report";
import type { LessonPhase } from "@/lib/schedule";

// A printed document cannot use the MUI theme, so the palette is mirrored here (see Providers.tsx).
const COLORS = {
  text: "#1B1B3A",
  muted: "#55557A",
  primary: "#5B5FEF",
  tint: "#F3F4FF",
  line: "#E3E4F5",
  success: "#059669",
  error: "#DC2626",
  info: "#0284C7",
  warning: "#D97706",
} as const;

const PHASES: Record<LessonPhase, { label: string; color: string }> = {
  held: { label: "Відбувся", color: COLORS.success },
  cancelled: { label: "Не відбувся", color: COLORS.error },
  unmarked: { label: "Не відмічено", color: COLORS.warning },
  upcoming: { label: "Заплановано", color: COLORS.info },
};

const MAX_SCORE = 12;
const PAGE_WIDTH = 595.28;
const PAGE_MARGIN = 40;
const CONTENT_WIDTH = Math.floor(PAGE_WIDTH - PAGE_MARGIN * 2);

const dayFormat = new Intl.DateTimeFormat("uk-UA", {
  timeZone: "Europe/Kyiv",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const shortDayFormat = new Intl.DateTimeFormat("uk-UA", {
  timeZone: "Europe/Kyiv",
  day: "2-digit",
  month: "2-digit",
});
const formatDay = (iso: string) => dayFormat.format(new Date(iso));
const formatShortDay = (iso: string) => shortDayFormat.format(new Date(iso));
const formatScore = (value: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value)}/${MAX_SCORE}`;

const tableLayout: CustomTableLayout = {
  hLineWidth: (index, node) => (index === 0 || index === node.table.body.length ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => COLORS.line,
  paddingTop: () => 4,
  paddingBottom: () => 4,
  fillColor: (row) => (row === 0 ? COLORS.tint : null),
};

let fontsReady = false;

// Roboto ships inside pdfmake with Cyrillic glyphs. Loading it from memory avoids reading files at runtime.
function setupPdfmake() {
  if (fontsReady) return;
  const storage = (
    pdfmake as unknown as { virtualfs: { writeFileSync(name: string, data: Buffer): void } }
  ).virtualfs;
  for (const [name, base64] of Object.entries(vfs)) {
    storage.writeFileSync(name, Buffer.from(base64, "base64"));
  }
  pdfmake.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });
  // The report has no images or links to fetch, so deny every outside resource.
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy(() => false);
  fontsReady = true;
}

const heading = (text: string): Content => ({
  text,
  fontSize: 13,
  bold: true,
  color: COLORS.primary,
  margin: [0, 18, 0, 6],
  headlineLevel: 1,
});

const note = (text: string): Content => ({ text, color: COLORS.muted, italics: true });

const headerCell = (text: string): TableCell => ({ text, bold: true, color: COLORS.muted });

function statCard(value: string, label: string, color: string): TableCell {
  return {
    stack: [
      { text: value, fontSize: 18, bold: true, color },
      { text: label, fontSize: 8, color: COLORS.muted },
    ],
    fillColor: COLORS.tint,
    margin: [6, 6, 6, 6],
  };
}

function summarySection(report: StudentReport): Content[] {
  const { summary } = report;
  const secondary = [
    summary.upcoming > 0 ? `Заплановано далі: ${summary.upcoming}` : null,
    summary.unmarked > 0 ? `Не відмічено: ${summary.unmarked}` : null,
    summary.extra > 0 ? `Додаткових уроків: ${summary.extra}` : null,
  ].filter(Boolean);

  return [
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [
            statCard(
              String(summary.held),
              `Проведено · ${formatHours(summary.heldMinutes)}`,
              COLORS.success,
            ),
            statCard(String(summary.cancelled), "Не відбулося", COLORS.error),
            statCard(String(summary.moved), "Перенесено", COLORS.info),
            statCard(
              report.averageScore === null ? "—" : formatScore(report.averageScore),
              `Середній бал · робіт: ${report.grades.length}`,
              COLORS.primary,
            ),
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 6,
        vLineColor: () => "#FFFFFF",
      },
      margin: [-6, 12, -6, 0],
    },
    ...(secondary.length
      ? [
          {
            text: secondary.join(" · "),
            color: COLORS.muted,
            fontSize: 9,
            margin: [0, 8, 0, 0],
          } as Content,
        ]
      : []),
  ];
}

function lessonRow(lesson: ReportLesson): TableCell[] {
  const phase = PHASES[lesson.phase];
  const statusLines: Content[] = [{ text: phase.label, color: phase.color }];
  if (lesson.movedFrom) {
    statusLines.push({
      text: `перенесено з ${formatShortDay(lesson.movedFrom)}`,
      fontSize: 8,
      color: COLORS.muted,
    });
  }
  if (lesson.isExtra) statusLines.push({ text: "додатковий", fontSize: 8, color: COLORS.muted });

  return [
    formatDay(lesson.startsAt),
    lessonTimeRange(lesson.startsAt, lesson.durationMinutes),
    { stack: statusLines },
    lesson.topic ? formatTopic(lesson.topic) : { text: "—", color: COLORS.muted },
  ];
}

function lessonsSection(report: StudentReport): Content[] {
  if (report.lessons.length === 0) {
    return [heading("Уроки"), note("У цьому періоді уроків немає.")];
  }
  return [
    heading("Уроки"),
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [62, 62, 90, "*"],
        body: [["Дата", "Час", "Статус", "Тема"].map(headerCell), ...report.lessons.map(lessonRow)],
      },
      layout: tableLayout,
    },
  ];
}

function topicsSection(report: StudentReport): Content[] {
  if (report.topics.length === 0) {
    return [heading("Вивчені теми"), note("Теми проведених уроків не вказано.")];
  }
  // Grades from 7 are split into algebra and geometry, earlier grades have one list.
  const groups = new Map<NushSubject, StudentReport["topics"]>();
  for (const entry of report.topics) {
    groups.set(entry.topic.subject, [...(groups.get(entry.topic.subject) ?? []), entry]);
  }
  const subjects = [...NUSH_SPLIT_SUBJECTS, "math" as const].filter((subject) =>
    groups.has(subject),
  );

  return [
    heading("Вивчені теми"),
    ...subjects.flatMap((subject): Content[] => [
      ...(subject === "math"
        ? []
        : [{ text: NUSH_SUBJECT_LABELS[subject], bold: true, margin: [0, 4, 0, 2] } as Content]),
      {
        ul: (groups.get(subject) ?? []).map(({ topic, dates }) => ({
          text: [
            { text: topic.title },
            { text: `  ${dates.map(formatShortDay).join(", ")}`, color: COLORS.muted, fontSize: 8 },
          ],
          margin: [0, 1, 0, 1],
        })),
      },
    ]),
  ];
}

// A line chart of homework scores on a 0-12 scale, drawn as SVG so it stays sharp when printed.
function gradesChart(grades: StudentReport["grades"]): Content {
  const height = 180;
  const plot = { left: 28, right: 10, top: 14, bottom: 30 };
  const plotWidth = CONTENT_WIDTH - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const x = (index: number) =>
    plot.left + (grades.length === 1 ? plotWidth / 2 : (plotWidth * index) / (grades.length - 1));
  const y = (score: number) => plot.top + plotHeight * (1 - score / MAX_SCORE);
  const labelEvery = Math.ceil(grades.length / Math.max(1, Math.floor(plotWidth / 34)));
  const showValues = grades.length <= 20;
  const font = `font-family="Roboto" fill="${COLORS.muted}"`;

  const grid = [0, 3, 6, 9, 12]
    .map(
      (value) =>
        `<line x1="${plot.left}" x2="${plot.left + plotWidth}" y1="${y(value)}" y2="${y(value)}" stroke="${COLORS.line}" stroke-width="0.5"/>` +
        `<text x="${plot.left - 6}" y="${y(value) + 2.5}" font-size="7" text-anchor="end" ${font}>${value}</text>`,
    )
    .join("");
  const line =
    grades.length > 1
      ? `<polyline fill="none" stroke="${COLORS.primary}" stroke-width="1.5" points="${grades
          .map((grade, index) => `${x(index)},${y(grade.score)}`)
          .join(" ")}"/>`
      : "";
  const points = grades
    .map(
      (grade, index) =>
        `<circle cx="${x(index)}" cy="${y(grade.score)}" r="2.5" fill="${COLORS.primary}"/>` +
        (showValues
          ? `<text x="${x(index)}" y="${y(grade.score) - 5}" font-size="7" text-anchor="middle" ${font}>${grade.score}</text>`
          : ""),
    )
    .join("");
  const labels = grades
    .map((grade, index) =>
      index % labelEvery === 0
        ? `<text x="${x(index)}" y="${height - 12}" font-size="7" text-anchor="middle" ${font}>${formatShortDay(grade.date)}</text>`
        : "",
    )
    .join("");

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${CONTENT_WIDTH}" height="${height}" viewBox="0 0 ${CONTENT_WIDTH} ${height}">${grid}${line}${points}${labels}</svg>`,
    margin: [0, 4, 0, 8],
    // pdfmake looks SVG fonts up on disk, but Roboto lives in memory. svg-to-pdfkit then keeps the current
    // document font (Roboto) and only warns, so the warning is muted. The chart text is digits and dates.
    options: { warningCallback: () => undefined },
  } as Content;
}

function gradesSection(report: StudentReport): Content[] {
  if (report.grades.length === 0) {
    return [heading("Динаміка оцінок"), note("Оцінених домашніх робіт у цьому періоді немає.")];
  }
  return [
    // The chart is one block, so the heading stays with it instead of being left on the previous page.
    { stack: [heading("Динаміка оцінок"), gradesChart(report.grades)], unbreakable: true },
    {
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [62, "*", 50],
        body: [
          ["Дата", "Домашня робота", "Оцінка"].map(headerCell),
          ...report.grades.map((grade): TableCell[] => [
            formatDay(grade.date),
            grade.title,
            { text: `${grade.score}/${MAX_SCORE}`, bold: true },
          ]),
        ],
      },
      layout: tableLayout,
    },
  ];
}

export async function renderReportPdf(report: StudentReport): Promise<Buffer> {
  setupPdfmake();
  const period =
    report.from === report.to
      ? formatDate(report.from)
      : `${formatDate(report.from)} – ${formatDate(report.to)}`;

  const pdf = pdfmake.createPdf({
    info: { title: `Звіт про навчання: ${report.student.name}` },
    pageSize: "A4",
    pageMargins: [PAGE_MARGIN, 48, PAGE_MARGIN, 48],
    // A heading left alone at the bottom of a page moves to the next one with its content.
    pageBreakBefore: (node, queries) =>
      node.headlineLevel === 1 && queries.getFollowingNodesOnPage().length === 0,
    defaultStyle: { font: "Roboto", fontSize: 10, color: COLORS.text },
    content: [
      { text: "Звіт про навчання", fontSize: 20, bold: true, color: COLORS.primary },
      { text: report.student.name, fontSize: 14, bold: true, margin: [0, 4, 0, 0] },
      {
        text: `${report.student.grade} клас · ${period}`,
        color: COLORS.muted,
        margin: [0, 2, 0, 0],
      },
      ...summarySection(report),
      ...lessonsSection(report),
      ...topicsSection(report),
      ...gradesSection(report),
    ],
    footer: (currentPage, pageCount) => ({
      text: `Сформовано ${formatDay(report.generatedAt)} · сторінка ${currentPage} з ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: COLORS.muted,
      margin: [0, 16, 0, 0],
    }),
  });
  return pdf.getBuffer();
}

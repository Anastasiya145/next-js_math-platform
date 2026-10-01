import type { StudentProgressPoint } from "@/lib/db";

type ProgressChartProps = {
  studentName: string;
  studentId: number;
  points: StudentProgressPoint[];
};

const SCORE_TICKS = [0, 3, 6, 9, 12];
const CHART_HEIGHT = 270;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 210;
const PLOT_LEFT = 48;
const PLOT_RIGHT_PADDING = 24;

function formatDate(value: string, includeYear = false) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "2-digit" } : {}),
  }).format(new Date(value));
}

export function ProgressChart({
  studentName,
  studentId,
  points,
}: ProgressChartProps) {
  const gradedPoints = points.filter(
    (point): point is StudentProgressPoint & { score: number } =>
      point.gradedAt !== null && point.score !== null,
  );
  const average = gradedPoints.length
    ? gradedPoints.reduce((total, point) => total + point.score, 0) /
      gradedPoints.length
    : null;
  const chartWidth = Math.max(640, gradedPoints.length * 96);
  const plotRight = chartWidth - PLOT_RIGHT_PADDING;
  const plotWidth = plotRight - PLOT_LEFT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const pointX = (index: number) =>
    gradedPoints.length === 1
      ? PLOT_LEFT + plotWidth / 2
      : PLOT_LEFT + (index * plotWidth) / (gradedPoints.length - 1);
  const pointY = (score: number) => PLOT_BOTTOM - (score / 12) * plotHeight;
  const linePoints = gradedPoints
    .map((point, index) => `${pointX(index)},${pointY(point.score)}`)
    .join(" ");
  const chartTitleId = `student-progress-title-${studentId}`;
  const chartDescriptionId = `student-progress-description-${studentId}`;

  return (
    <section className="panel student-progress-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">ОЦІНКИ ЗА ЧАСОМ</span>
          <h2>Динаміка результатів</h2>
        </div>
        {average !== null && (
          <p className="progress-average">
            Середня оцінка <strong>{average.toFixed(1)}/12</strong>
          </p>
        )}
      </div>

      {gradedPoints.length === 0 ? (
        <div className="progress-empty-state">
          <strong>Поки немає оцінених робіт</strong>
          <p>Графік з&apos;явиться після перевірки першої домашньої роботи.</p>
        </div>
      ) : (
        <>
          <figure className="progress-chart-figure">
            <div className="progress-chart-scroll">
              <svg
                className="progress-chart"
                viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
                role="img"
                aria-labelledby={chartTitleId}
                aria-describedby={chartDescriptionId}
              >
                <title id={chartTitleId}>Прогрес ученика: {studentName}</title>
                <desc id={chartDescriptionId}>
                  Оцінки за призначені домашні роботи за шкалою від 0 до 12.
                </desc>
                {SCORE_TICKS.map((tick) => {
                  const y = pointY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={PLOT_LEFT}
                        x2={plotRight}
                        y1={y}
                        y2={y}
                        className="progress-grid-line"
                      />
                      <text
                        x={PLOT_LEFT - 12}
                        y={y + 4}
                        textAnchor="end"
                        className="progress-axis-label"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}
                <polyline points={linePoints} className="progress-line" />
                {gradedPoints.map((point, index) => (
                  <g key={`${point.homeworkId}-${point.submittedAt}`}>
                    <circle
                      cx={pointX(index)}
                      cy={pointY(point.score)}
                      r={5}
                      className="progress-point"
                    >
                      <title>
                        {point.title}: {point.score}/12 ·{" "}
                        {formatDate(point.submittedAt, true)}
                      </title>
                    </circle>
                    <text
                      x={pointX(index)}
                      y={PLOT_BOTTOM + 24}
                      textAnchor="middle"
                      className="progress-axis-label"
                    >
                      {formatDate(point.submittedAt)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <figcaption className="progress-chart-legend">
              <span className="progress-legend-swatch" aria-hidden="true" />
              Оцінка за домашню роботу (0–12)
            </figcaption>
          </figure>
          <details className="progress-data-details">
            <summary>Показати оцінки списком</summary>
            <div className="progress-table-scroll">
              <table className="progress-table">
                <thead>
                  <tr>
                    <th scope="col">Дата</th>
                    <th scope="col">Домашня робота</th>
                    <th scope="col">Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={`${point.homeworkId}-${point.submittedAt}`}>
                      <td>{formatDate(point.submittedAt, true)}</td>
                      <td>{point.title}</td>
                      <td>
                        {point.score === null
                          ? "Очікує перевірки"
                          : `${point.score}/12${point.status === "no_homework" ? " · Немає ДЗ" : ""}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

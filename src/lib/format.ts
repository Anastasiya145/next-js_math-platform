export const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "Без терміну";

// Lessons are shown in Kyiv time so server and browser render the same text.
export const lessonParts = (value: string) => {
  const parts = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    date: `${get("day")} ${get("month")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};

export const formatLesson = (value: string) => {
  const { weekday, date, time } = lessonParts(value);
  return `${weekday}, ${date}, ${time}`;
};

// Homework is due at the teacher's next lesson; the plain due date is only a fallback.
export const formatDue = (nextLessonAt: string | null, dueAt: string | null) =>
  nextLessonAt ? formatLesson(nextLessonAt) : formatDateTime(dueAt);

const kyivFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

const kyivOffsetMs = (timestamp: number) => {
  const parts = kyivFormat.formatToParts(new Date(timestamp));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - timestamp
  );
};

// Inverse of kyivLocalToIso: an ISO instant as a datetime-local value in Kyiv time.
export const isoToKyivLocal = (value: string) => {
  const parts = kyivFormat.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    (parts.find((part) => part.type === type)?.value ?? "").padStart(2, "0");
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

// Converts a datetime-local value (YYYY-MM-DDTHH:mm) typed as Kyiv time to an ISO instant, whatever the browser time zone is.
export const kyivLocalToIso = (value: string) => {
  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  const guess = wallClock - kyivOffsetMs(wallClock);
  return new Date(wallClock - kyivOffsetMs(guess)).toISOString();
};

export const formatMoney = (value: number) => `${new Intl.NumberFormat("uk-UA").format(value)} грн`;

// A calendar date (YYYY-MM-DD) as "10 жовтня 2026", independent of the viewer's time zone.
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("uk-UA", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(/\s*р\.$/, "");

export const formatHours = (minutes: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(minutes / 60)} год`;

// "16:00–17:00" in Kyiv time.
export const lessonTimeRange = (startsAt: string, durationMinutes: number) =>
  `${lessonParts(startsAt).time}–${lessonParts(new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()).time}`;

export const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

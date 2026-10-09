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

export const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

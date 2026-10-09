export const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "Без терміну";

// Calendar dates arrive as "YYYY-MM-DD" and must not shift with the local time zone.
export const formatDay = (value: string, withWeekday = false) =>
  new Intl.DateTimeFormat("uk-UA", {
    ...(withWeekday ? { weekday: "long" } : {}),
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));

export const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

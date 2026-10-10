import { isoToKyivLocal, kyivLocalToIso } from "@/lib/format";

// Weekdays are ISO numbers (1 = Monday) and all slot times are Kyiv local time.
export type LessonSlot = {
  weekday: number;
  startTime: string;
  durationMinutes: number;
  startsOn: string;
  endsOn: string | null;
};

export type ScheduleStudent = {
  id: number;
  name: string;
  grade: number;
  hourlyRate: number;
  slots: LessonSlot[];
};

export type LessonStatus = "planned" | "held" | "cancelled";

// A lesson that was marked, moved or added by hand. `scheduledAt` is its stable key.
export type LessonRow = {
  studentId: number;
  scheduledAt: string;
  startsAt: string;
  durationMinutes: number;
  status: LessonStatus;
  isExtra: boolean;
  hourlyRate: number;
};

export type Lesson = LessonRow & { studentName: string };

export type ScheduleData = { students: ScheduleStudent[]; lessons: Lesson[] };

export const MAX_HOURLY_RATE = 100000;
export const MIN_LESSON_MINUTES = 15;
export const MAX_LESSON_MINUTES = 240;
export const DEFAULT_LESSON_MINUTES = 60;
export const MAX_SLOTS_PER_STUDENT = 14;
export const MAX_RANGE_DAYS = 92;

export const WEEKDAY_NAMES = [
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П'ятниця",
  "Субота",
  "Неділя",
] as const;
export const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"] as const;

export const slotLabel = (slot: Pick<LessonSlot, "weekday" | "startTime">) =>
  `${WEEKDAY_SHORT[slot.weekday - 1]} ${slot.startTime}`;

export const isTimeString = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const isDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const addDays = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

const isoWeekday = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
};

export const todayKyiv = () => isoToKyivLocal(new Date().toISOString()).slice(0, 10);

// Month "YYYY-MM" as the half-open date range [from, to).
export const monthRange = (month: string) => {
  const [year, number] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 10),
  };
};

export const shiftMonth = (month: string, delta: number) => {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
};

const slotCovers = (slot: LessonSlot, date: string) =>
  date >= slot.startsOn &&
  (!slot.endsOn || date <= slot.endsOn) &&
  isoWeekday(date) === slot.weekday;

// The slot that produces a planned lesson at this instant, if any.
export const findSlotFor = (slots: LessonSlot[], scheduledAt: string) => {
  const [date, time] = isoToKyivLocal(scheduledAt).split("T");
  return slots.find((slot) => slot.startTime === time && slotCovers(slot, date)) ?? null;
};

const keyOf = (studentId: number, scheduledAt: string) => `${studentId}|${scheduledAt}`;

// Merges generated slot occurrences with stored lesson rows for the Kyiv dates [from, to).
export function buildLessons(input: {
  students: ScheduleStudent[];
  rows: LessonRow[];
  from: string;
  to: string;
}): Lesson[] {
  const students = new Map(input.students.map((student) => [student.id, student]));
  const rangeStart = kyivLocalToIso(`${input.from}T00:00`);
  const rangeEnd = kyivLocalToIso(`${input.to}T00:00`);
  const taken = new Set(input.rows.map((row) => keyOf(row.studentId, row.scheduledAt)));
  const lessons: Lesson[] = [];

  for (const row of input.rows) {
    const student = students.get(row.studentId);
    if (!student || row.startsAt < rangeStart || row.startsAt >= rangeEnd) continue;
    // A held lesson keeps the rate it was held at.
    const hourlyRate = row.status === "held" ? row.hourlyRate : student.hourlyRate;
    lessons.push({ ...row, studentName: student.name, hourlyRate });
  }

  for (let date = input.from; date < input.to; date = addDays(date, 1)) {
    for (const student of input.students) {
      for (const slot of student.slots) {
        if (!slotCovers(slot, date)) continue;
        const scheduledAt = kyivLocalToIso(`${date}T${slot.startTime}`);
        const key = keyOf(student.id, scheduledAt);
        if (taken.has(key)) continue;
        taken.add(key);
        lessons.push({
          studentId: student.id,
          studentName: student.name,
          scheduledAt,
          startsAt: scheduledAt,
          durationMinutes: slot.durationMinutes,
          status: "planned",
          isExtra: false,
          hourlyRate: student.hourlyRate,
        });
      }
    }
  }

  return lessons.sort(
    (first, second) =>
      first.startsAt.localeCompare(second.startsAt) ||
      first.studentName.localeCompare(second.studentName),
  );
}

export const lessonIncome = (lesson: Pick<Lesson, "hourlyRate" | "durationMinutes">) =>
  Math.round((lesson.hourlyRate * lesson.durationMinutes) / 60);

export const lessonEnd = (lesson: Pick<Lesson, "startsAt" | "durationMinutes">) =>
  new Date(lesson.startsAt).getTime() + lesson.durationMinutes * 60_000;

export const isMoved = (lesson: Pick<Lesson, "startsAt" | "scheduledAt" | "isExtra">) =>
  !lesson.isExtra && lesson.startsAt !== lesson.scheduledAt;

// "unmarked" is a planned lesson whose time has already passed.
export type LessonPhase = "held" | "cancelled" | "upcoming" | "unmarked";

export const lessonPhase = (lesson: Lesson, now: number): LessonPhase =>
  lesson.status !== "planned" ? lesson.status : lessonEnd(lesson) <= now ? "unmarked" : "upcoming";

export type BudgetFigures = {
  held: number;
  upcoming: number;
  unmarked: number;
  cancelled: number;
  heldMinutes: number;
  heldIncome: number;
  upcomingIncome: number;
};

export type BudgetLine = BudgetFigures & { studentId: number; name: string };

const emptyFigures = (): BudgetFigures => ({
  held: 0,
  upcoming: 0,
  unmarked: 0,
  cancelled: 0,
  heldMinutes: 0,
  heldIncome: 0,
  upcomingIncome: 0,
});

const addLesson = (figures: BudgetFigures, lesson: Lesson, phase: LessonPhase) => {
  if (phase === "held") {
    figures.held += 1;
    figures.heldMinutes += lesson.durationMinutes;
    figures.heldIncome += lessonIncome(lesson);
  } else if (phase === "upcoming") {
    figures.upcoming += 1;
    figures.upcomingIncome += lessonIncome(lesson);
  } else if (phase === "unmarked") {
    figures.unmarked += 1;
  } else {
    figures.cancelled += 1;
  }
};

// Income counts held lessons plus upcoming planned ones; unmarked past lessons are reported but not counted.
export function summarizeBudget(lessons: Lesson[], now: number) {
  const totals = emptyFigures();
  const lines = new Map<number, BudgetLine>();
  for (const lesson of lessons) {
    const phase = lessonPhase(lesson, now);
    const line = lines.get(lesson.studentId) ?? {
      ...emptyFigures(),
      studentId: lesson.studentId,
      name: lesson.studentName,
    };
    lines.set(lesson.studentId, line);
    addLesson(line, lesson, phase);
    addLesson(totals, lesson, phase);
  }
  return {
    totals,
    lines: [...lines.values()].sort((first, second) => first.name.localeCompare(second.name)),
  };
}

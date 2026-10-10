import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { createExtraLesson, deleteLesson, listLessons, updateLesson } from "@/lib/db";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_LESSON_MINUTES,
  MAX_RANGE_DAYS,
  MIN_LESSON_MINUTES,
  addDays,
  isDateString,
  type LessonStatus,
} from "@/lib/schedule";

const STATUSES: readonly string[] = ["planned", "held", "cancelled"] satisfies LessonStatus[];
const MAX_STUDENT_FILTER = 100;

const denied = () =>
  NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });

const toInstant = (value: unknown) => {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export async function GET(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (
    !isDateString(from) ||
    !isDateString(to) ||
    from >= to ||
    to > addDays(from, MAX_RANGE_DAYS)
  ) {
    return NextResponse.json({ error: errorMessages.schedule.invalidRange }, { status: 400 });
  }

  const filter = params.get("studentIds");
  let studentIds: number[] | undefined;
  if (filter !== null) {
    studentIds = filter.split(",").map(Number);
    if (
      studentIds.length > MAX_STUDENT_FILTER ||
      !studentIds.every((id) => Number.isInteger(id) && id > 0)
    ) {
      return NextResponse.json({ error: errorMessages.schedule.invalidStudents }, { status: 400 });
    }
  }

  return NextResponse.json({ data: await listLessons({ from, to, studentIds }) });
}

// Adds a one-off lesson outside the weekly schedule.
export async function POST(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const body = (await request.json().catch(() => null)) as {
    studentId?: unknown;
    startsAt?: unknown;
    durationMinutes?: unknown;
  } | null;
  const startsAt = toInstant(body?.startsAt);
  const durationMinutes = body?.durationMinutes;
  if (
    !isId(body?.studentId) ||
    !startsAt ||
    typeof durationMinutes !== "number" ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_LESSON_MINUTES ||
    durationMinutes > MAX_LESSON_MINUTES
  ) {
    return NextResponse.json({ error: errorMessages.schedule.invalidLesson }, { status: 400 });
  }

  const result = await createExtraLesson({ studentId: body.studentId, startsAt, durationMinutes });
  if (result === "missing") {
    return NextResponse.json({ error: errorMessages.students.notFound }, { status: 404 });
  }
  if (result === "duplicate") {
    return NextResponse.json({ error: errorMessages.schedule.lessonDuplicate }, { status: 409 });
  }
  return NextResponse.json({ data: { created: true } }, { status: 201 });
}

// Marks a lesson as held or cancelled, moves it to another time, or puts it back to planned.
export async function PATCH(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const body = (await request.json().catch(() => null)) as {
    studentId?: unknown;
    scheduledAt?: unknown;
    status?: unknown;
    startsAt?: unknown;
  } | null;
  const scheduledAt = toInstant(body?.scheduledAt);
  const startsAt = body?.startsAt === undefined ? undefined : toInstant(body.startsAt);
  const status = body?.status;
  if (
    !isId(body?.studentId) ||
    !scheduledAt ||
    startsAt === null ||
    (status !== undefined && (typeof status !== "string" || !STATUSES.includes(status))) ||
    (status === undefined && startsAt === undefined)
  ) {
    return NextResponse.json({ error: errorMessages.schedule.invalidLesson }, { status: 400 });
  }

  const updated = await updateLesson({
    studentId: body.studentId,
    scheduledAt,
    status: status as LessonStatus | undefined,
    startsAt,
  });
  if (!updated) {
    return NextResponse.json({ error: errorMessages.schedule.lessonNotFound }, { status: 404 });
  }
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const params = new URL(request.url).searchParams;
  const studentId = Number(params.get("studentId"));
  const scheduledAt = toInstant(params.get("scheduledAt"));
  if (!isId(studentId) || !scheduledAt) {
    return NextResponse.json({ error: errorMessages.schedule.invalidLesson }, { status: 400 });
  }
  if (!(await deleteLesson(studentId, scheduledAt))) {
    return NextResponse.json({ error: errorMessages.schedule.lessonNotFound }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}

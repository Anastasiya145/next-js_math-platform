import { NextResponse } from "next/server";
import { errorMessages } from "@/lib/error-messages";
import { getStudentUser, getTeacherUser } from "@/lib/authz";
import {
  createHomework,
  listHomeworkForStudent,
  listHomeworkForTeacher,
} from "@/lib/db";

export async function GET() {
  const teacher = await getTeacherUser();
  if (teacher)
    return NextResponse.json({ data: await listHomeworkForTeacher() });

  const student = await getStudentUser();
  if (student) {
    return NextResponse.json({
      data: await listHomeworkForStudent(student.studentId),
    });
  }
  return NextResponse.json(
    { error: errorMessages.common.accessDenied },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    instructions?: string;
    resourceUrl?: string;
    dueAt?: string | null;
    nextLessonAt?: string | null;
    studentIds?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const instructions =
    typeof body?.instructions === "string" ? body.instructions.trim() : "";
  const resourceUrl =
    typeof body?.resourceUrl === "string" ? body.resourceUrl.trim() : "";
  const dueAt =
    typeof body?.dueAt === "string" ? body.dueAt.trim() || null : null;
  const nextLessonAt =
    typeof body?.nextLessonAt === "string"
      ? body.nextLessonAt.trim() || null
      : null;
  const studentIds = Array.isArray(body?.studentIds)
    ? body.studentIds.filter(
        (id): id is number => Number.isInteger(id) && Number(id) > 0,
      )
    : [];

  if (
    !title ||
    title.length > 160 ||
    instructions.length > 4000 ||
    studentIds.length === 0 ||
    (resourceUrl && !isValidHttpUrl(resourceUrl)) ||
    (dueAt && Number.isNaN(Date.parse(dueAt))) ||
    (nextLessonAt && !isValidDateOnly(nextLessonAt))
  ) {
    return NextResponse.json(
      { error: errorMessages.homework.invalidAssignment },
      { status: 400 },
    );
  }

  try {
    const id = await createHomework({
      title,
      instructions,
      resourceUrl,
      dueAt,
      nextLessonAt,
      createdBy: teacher.email ?? "teacher",
      studentIds,
    });
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === errorMessages.database.homeworkStudentsMissing
    ) {
      return NextResponse.json(
        { error: errorMessages.homework.studentNotFound },
        { status: 404 },
      );
    }
    throw error;
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

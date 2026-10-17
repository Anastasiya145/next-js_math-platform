import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { deleteHomework, updateHomework } from "@/lib/db";
import { isHttpUrl, isPositiveInteger } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const homeworkId = Number((await context.params).homeworkId);
  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    instructions?: unknown;
    resourceUrl?: unknown;
    nextLessonAt?: unknown;
    studentIds?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const instructions =
    typeof body?.instructions === "string" ? body.instructions.trim() : "";
  const resourceUrl =
    typeof body?.resourceUrl === "string" ? body.resourceUrl.trim() : "";
  const nextLessonAt =
    typeof body?.nextLessonAt === "string"
      ? body.nextLessonAt.trim() || null
      : null;
  const studentIds = Array.isArray(body?.studentIds)
    ? body.studentIds.filter(isPositiveInteger)
    : [];

  if (
    !title ||
    title.length > 160 ||
    instructions.length > 4000 ||
    studentIds.length === 0 ||
    (resourceUrl && !isHttpUrl(resourceUrl)) ||
    (nextLessonAt && Number.isNaN(Date.parse(nextLessonAt)))
  ) {
    return NextResponse.json(
      { error: errorMessages.homework.invalidAssignment },
      { status: 400 },
    );
  }
  if (!isPositiveInteger(homeworkId)) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }

  const result = await updateHomework({
    homeworkId,
    title,
    instructions,
    resourceUrl,
    nextLessonAt,
    studentIds,
  });
  if (result === "notFound") {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  if (result === "studentsMissing") {
    return NextResponse.json(
      { error: errorMessages.homework.studentNotFound },
      { status: 404 },
    );
  }
  if (result === "studentLocked") {
    return NextResponse.json(
      { error: errorMessages.homework.studentLocked },
      { status: 409 },
    );
  }
  return NextResponse.json({ data: { id: homeworkId } });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const homeworkId = Number((await context.params).homeworkId);
  if (!isPositiveInteger(homeworkId) || !(await deleteHomework(homeworkId))) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { id: homeworkId } });
}

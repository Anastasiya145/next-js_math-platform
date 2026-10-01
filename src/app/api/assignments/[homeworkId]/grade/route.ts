import { NextResponse } from "next/server";
import { errorMessages } from "@/lib/error-messages";
import { getTeacherUser } from "@/lib/authz";
import { gradeHomework, isHomeworkAssignedToStudent } from "@/lib/db";

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
    studentId?: number;
    score?: number;
    feedback?: string;
  } | null;
  const studentId = Number(body?.studentId);
  const score = Number(body?.score);
  const feedback = body?.feedback?.trim() ?? "";
  if (
    !Number.isInteger(homeworkId) ||
    homeworkId < 1 ||
    !Number.isInteger(studentId) ||
    studentId < 1 ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 12 ||
    feedback.length > 2000
  ) {
    return NextResponse.json(
      { error: errorMessages.homework.invalidScore },
      { status: 400 },
    );
  }
  if (!(await isHomeworkAssignedToStudent(homeworkId, studentId))) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  if (!(await gradeHomework({ homeworkId, studentId, score, feedback }))) {
    return NextResponse.json(
      { error: errorMessages.homework.studentHasNotSubmitted },
      { status: 409 },
    );
  }
  return NextResponse.json({
    data: { homeworkId, studentId, score, feedback },
  });
}

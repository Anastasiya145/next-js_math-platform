import { NextResponse } from "next/server";
import { errorMessages } from "@/lib/error-messages";
import { getStudentUser } from "@/lib/authz";
import { listHomeworkForStudent, saveHomeworkSubmission } from "@/lib/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  const student = await getStudentUser();
  if (!student) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const homeworkId = Number((await context.params).homeworkId);
  if (!Number.isInteger(homeworkId) || homeworkId < 1) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  const homeworks = await listHomeworkForStudent(student.studentId);
  const homework = homeworks.find((item) => item.id === homeworkId);
  if (!homework) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  if (homework.submission.gradedAt) {
    return NextResponse.json(
      { error: errorMessages.homework.submissionLocked },
      { status: 409 },
    );
  }

  const saved = await saveHomeworkSubmission({
    homeworkId,
    studentId: student.studentId,
    status: "no_homework",
  });
  if (!saved) {
    return NextResponse.json(
      { error: errorMessages.homework.submissionLockedForEdit },
      { status: 409 },
    );
  }
  return NextResponse.json({ data: { score: 0, status: "no_homework" } });
}

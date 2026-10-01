import { NextResponse } from "next/server";
import { getStudentUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  getStudentById,
  getStudentProgress,
  listHomeworkForStudent,
  listTextbooksForGrade,
} from "@/lib/db";

export async function GET() {
  const user = await getStudentUser();
  if (!user) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const student = await getStudentById(user.studentId);
  if (!student) {
    return NextResponse.json(
      { error: errorMessages.studentDashboard.studentNotFound },
      { status: 404 },
    );
  }

  const [textbooks, homeworks, progress] = await Promise.all([
    listTextbooksForGrade(student.grade),
    listHomeworkForStudent(student.id),
    getStudentProgress(student.id),
  ]);
  const gradedPoints = progress.filter(
    (point) => point.gradedAt !== null && point.score !== null,
  );
  const averageScore = gradedPoints.length
    ? Number(
        (
          gradedPoints.reduce((total, point) => total + (point.score ?? 0), 0) /
          gradedPoints.length
        ).toFixed(1),
      )
    : null;

  return NextResponse.json({
    data: {
      student: { id: student.id, name: student.name, grade: student.grade },
      textbooks,
      homeworks,
      progress,
      averageScore,
      gradedCount: gradedPoints.length,
    },
  });
}

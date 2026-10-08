import { NextResponse } from "next/server";
import { getStudentUser, getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  getStudentById,
  getStudentProgress,
  listHomeworkForStudent,
  listTextbooksForGrade,
} from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentIdParam = url.searchParams.get("studentId");

  let student;

  // If studentId parameter provided, teacher is viewing student's profile
  if (studentIdParam) {
    const teacher = await getTeacherUser();
    if (!teacher) {
      return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
    }
    student = await getStudentById(Number(studentIdParam));
  } else {
    // Otherwise, student is viewing their own dashboard
    const user = await getStudentUser();
    if (!user) {
      return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
    }
    student = await getStudentById(user.studentId);
  }

  if (!student) {
    return NextResponse.json(
      { error: errorMessages.studentDashboard.studentNotFound },
      { status: 404 },
    );
  }

  const studentId = student.id;
  const [textbooks, homeworks, progress] = await Promise.all([
    listTextbooksForGrade(student.grade),
    listHomeworkForStudent(studentId),
    getStudentProgress(studentId),
  ]);
  const gradedPoints = progress.filter((point) => point.gradedAt !== null && point.score !== null);
  const averageScore = gradedPoints.length
    ? Number(
        (
          gradedPoints.reduce((total, point) => total + (point.score ?? 0), 0) / gradedPoints.length
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

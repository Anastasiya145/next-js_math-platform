import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { getStudentById, getStudentProgress, listLessons } from "@/lib/db";
import { errorMessages } from "@/lib/error-messages";
import { buildStudentReport, MAX_REPORT_DAYS } from "@/lib/report";
import { renderReportPdf } from "@/lib/report-pdf";
import { addDays, isDateString } from "@/lib/schedule";

export const runtime = "nodejs";

// PDF report for one student over the inclusive period `from`..`to` (Kyiv dates, YYYY-MM-DD).
export async function GET(request: Request, context: { params: Promise<{ studentId: string }> }) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const studentId = Number((await context.params).studentId);
  if (!Number.isInteger(studentId) || studentId < 1) {
    return NextResponse.json({ error: errorMessages.students.invalidId }, { status: 400 });
  }

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (
    !isDateString(from) ||
    !isDateString(to) ||
    from > to ||
    addDays(from, MAX_REPORT_DAYS) <= to
  ) {
    return NextResponse.json({ error: errorMessages.report.invalidRange }, { status: 400 });
  }

  try {
    const [student, schedule, progress] = await Promise.all([
      getStudentById(studentId),
      listLessons({ from, to: addDays(to, 1), studentIds: [studentId] }),
      getStudentProgress(studentId),
    ]);
    if (!student) {
      return NextResponse.json({ error: errorMessages.students.notFound }, { status: 404 });
    }

    const report = buildStudentReport({
      student: { name: student.name, grade: student.grade },
      from,
      to,
      lessons: schedule.lessons,
      progress,
      now: Date.now(),
    });
    const pdf = await renderReportPdf(report);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${from}-${to}.pdf"; filename*=UTF-8''${encodeURIComponent(`Звіт ${student.name} ${from} ${to}.pdf`)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to build the student report", error);
    return NextResponse.json({ error: errorMessages.report.generateFailed }, { status: 500 });
  }
}

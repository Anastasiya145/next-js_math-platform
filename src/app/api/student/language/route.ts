import { NextResponse } from "next/server";
import { getStudentUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { isAppLocale } from "@/lib/languages";
import { updateStudentUiLanguage } from "@/lib/db";

export async function PATCH(request: Request) {
  const student = await getStudentUser();
  if (!student || student.siteType !== "languages") {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    uiLanguage?: unknown;
  } | null;
  if (!isAppLocale(body?.uiLanguage) || body.uiLanguage === "uk") {
    return NextResponse.json(
      { error: errorMessages.students.uiLanguageInvalid },
      { status: 400 },
    );
  }

  const updated = await updateStudentUiLanguage(
    student.studentId,
    body.uiLanguage,
  );
  if (!updated) {
    return NextResponse.json(
      { error: errorMessages.studentDashboard.studentNotFound },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { uiLanguage: body.uiLanguage } });
}

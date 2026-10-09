import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { getTeacherGoogleDriveAccessToken } from "@/lib/google-drive";
import { getStudentById, replaceStudentDriveFolderId } from "@/lib/db";

const FOLDER_ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export async function PUT(request: Request, context: { params: Promise<{ studentId: string }> }) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const studentId = Number((await context.params).studentId);
  if (!Number.isInteger(studentId) || studentId < 1 || !(await getStudentById(studentId))) {
    return NextResponse.json({ error: errorMessages.students.notFound }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { folderId?: unknown } | null;
  const folderId = typeof body?.folderId === "string" ? body.folderId.trim() : "";
  if (!FOLDER_ID_PATTERN.test(folderId)) {
    return NextResponse.json({ error: errorMessages.drive.folderInvalid }, { status: 400 });
  }

  const accessToken = teacher.email ? await getTeacherGoogleDriveAccessToken(teacher.email) : null;
  if (!accessToken) {
    return NextResponse.json({ error: errorMessages.drive.pickerNotConnected }, { status: 503 });
  }

  // Confirms the app can see the folder, i.e. it was granted through Google Picker.
  const driveResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,mimeType`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const folder = driveResponse.ok ? ((await driveResponse.json()) as { mimeType?: string }) : null;
  if (folder?.mimeType !== FOLDER_MIME_TYPE) {
    return NextResponse.json({ error: errorMessages.drive.folderNotAccessible }, { status: 422 });
  }

  if (!(await replaceStudentDriveFolderId(studentId, folderId))) {
    return NextResponse.json({ error: errorMessages.drive.folderAlreadyUsed }, { status: 409 });
  }
  return NextResponse.json({ data: { studentId, folderId } });
}

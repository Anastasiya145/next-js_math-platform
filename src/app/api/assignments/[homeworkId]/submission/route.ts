import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getStudentUser, getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { getGoogleDriveAccessToken, getTeacherGoogleDriveAccessToken } from "@/lib/google-drive";
import {
  getHomeworkSubmissionFile,
  getStudentById,
  getStudentDriveFolderId,
  isHomeworkAssignedToStudent,
  listHomeworkForStudent,
  saveHomeworkSubmission,
  setStudentDriveFolderId,
} from "@/lib/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const homeworkId = Number((await context.params).homeworkId);
  const requestedStudentId = Number(
    new URL(request.url).searchParams.get("studentId"),
  );
  const studentId = requestedStudentId;
  if (
    !Number.isInteger(homeworkId) ||
    homeworkId < 1 ||
    !Number.isInteger(studentId) ||
    studentId < 1 ||
    !(await isHomeworkAssignedToStudent(homeworkId, studentId))
  ) {
    return NextResponse.json(
      { error: errorMessages.homework.fileNotFound },
      { status: 404 },
    );
  }

  const file = await getHomeworkSubmissionFile(homeworkId, studentId);
  if (!file) {
    return NextResponse.json(
      { error: errorMessages.homework.fileNotFound },
      { status: 404 },
    );
  }
  const accessToken = await getGoogleDriveAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: errorMessages.drive.reconnectRequired },
      { status: 503 },
    );
  }

  const driveResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.driveFileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!driveResponse.ok || !driveResponse.body) {
    return NextResponse.json(
      { error: errorMessages.drive.downloadFailed },
      { status: 502 },
    );
  }

  return new NextResponse(driveResponse.body, {
    headers: {
      "Content-Type":
        driveResponse.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  const student = await getStudentUser();
  if (!student) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  const studentProfile = await getStudentById(student.studentId);
  if (!studentProfile) {
    return NextResponse.json(
      { error: errorMessages.homework.studentNotFound },
      { status: 404 },
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
  if (
    !homework ||
    !(await isHomeworkAssignedToStudent(homeworkId, student.studentId))
  ) {
    return NextResponse.json(
      { error: errorMessages.homework.assignmentNotFound },
      { status: 404 },
    );
  }
  if (homework.submission.gradedAt) {
    return NextResponse.json(
      { error: errorMessages.homework.submissionAlreadyGraded },
      { status: 409 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: errorMessages.homework.fileRequired },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: errorMessages.homework.fileTooLarge },
      { status: 413 },
    );
  }
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: errorMessages.homework.fileTypeNotAllowed },
      { status: 415 },
    );
  }

  // Get teacher's Google Drive access token
  const teacherEmail = "ivanovaanastasiya145@gmail.com";
  const accessToken = await getTeacherGoogleDriveAccessToken(teacherEmail);
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          errorMessages.drive.connectRequired,
      },
      { status: 503 },
    );
  }

  let driveFolderId = await getStudentDriveFolderId(student.studentId);
  if (!driveFolderId) {
    const folderResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${studentProfile.name} - ${studentProfile.grade} клас`,
          mimeType: "application/vnd.google-apps.folder",
          appProperties: { studentId: String(student.studentId) },
        }),
      },
    );
    if (!folderResponse.ok) {
      return NextResponse.json(
        { error: errorMessages.drive.createFolderFailed },
        { status: 502 },
      );
    }
    const folder = (await folderResponse.json()) as { id?: string };
    if (!folder.id) {
      return NextResponse.json(
        { error: errorMessages.drive.folderIdMissing },
        { status: 502 },
      );
    }
    driveFolderId = await setStudentDriveFolderId(student.studentId, folder.id);
  }

  const boundary = `tutor-${randomUUID()}`;
  const safeFileName = file.name.replace(/[\r\n"\\/]/g, "_").slice(0, 180);
  const metadata = {
    name: `${studentProfile.name} - ${homework.title} - ${safeFileName}`,
    mimeType: file.type,
    parents: [driveFolderId],
    appProperties: {
      homeworkId: String(homeworkId),
      studentId: String(student.studentId),
    },
  };
  const bytes = Buffer.from(await file.arrayBuffer());
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const driveResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!driveResponse.ok) {
    return NextResponse.json(
      { error: errorMessages.drive.uploadRejected },
      { status: 502 },
    );
  }

  const driveFile = (await driveResponse.json()) as {
    id?: string;
    name?: string;
  };
  if (!driveFile.id) {
    return NextResponse.json(
      { error: errorMessages.drive.fileIdMissing },
      { status: 502 },
    );
  }

  const saved = await saveHomeworkSubmission({
    homeworkId,
    studentId: student.studentId,
    status: "submitted",
    driveFileId: driveFile.id,
    fileName: safeFileName,
  });
  if (!saved) {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFile.id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ).catch(() => null);
    return NextResponse.json(
      { error: errorMessages.homework.submissionResubmitClosed },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { data: { fileName: safeFileName } },
    { status: 201 },
  );
}

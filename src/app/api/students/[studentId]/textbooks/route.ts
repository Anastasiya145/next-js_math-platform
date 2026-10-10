import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  getStudentTextbooks,
  addStudentTextbook,
  deleteStudentTextbook,
  updateStudentTextbook,
  type PersonalStudentTextbook,
} from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const { studentId } = await params;
  const id = parseInt(studentId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  try {
    const textbooks = await getStudentTextbooks(id);
    return NextResponse.json({ data: textbooks });
  } catch {
    return NextResponse.json({ error: "Failed to load textbooks" }, { status: 500 });
  }
}

type PostBody = {
  title?: string;
  url?: string;
  subject?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const { studentId } = await params;
  const id = parseInt(studentId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const title = body?.title?.trim();
  const url = body?.url?.trim();

  if (!title || !url) {
    return NextResponse.json({ error: "Title and URL required" }, { status: 400 });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const textbook = await addStudentTextbook({
      studentId: id,
      title,
      url,
      subject: body?.subject,
    });
    return NextResponse.json({ data: textbook }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add textbook" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const studentId = Number((await params).studentId);
  const textbookId = Number(new URL(request.url).searchParams.get("textbookId"));
  if (
    !Number.isInteger(studentId) ||
    studentId < 1 ||
    !Number.isInteger(textbookId) ||
    textbookId < 1
  ) {
    return NextResponse.json({ error: errorMessages.textbooks.notFound }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const title = body?.title?.trim();
  const url = body?.url?.trim() ?? "";
  const subject = body?.subject?.trim() ?? "";
  const validUrl = (() => {
    try {
      return ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
      return false;
    }
  })();
  if (!title || title.length > 180 || !validUrl || subject.length > 80) {
    return NextResponse.json({ error: errorMessages.textbooks.invalidInput }, { status: 400 });
  }

  if (!(await updateStudentTextbook({ studentId, textbookId, title, url, subject }))) {
    return NextResponse.json({ error: errorMessages.textbooks.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { id: textbookId } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const textbookId = searchParams.get("textbookId");

  if (!textbookId) {
    return NextResponse.json({ error: "Textbook ID required" }, { status: 400 });
  }

  const id = parseInt(textbookId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid textbook ID" }, { status: 400 });
  }

  try {
    await deleteStudentTextbook(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete textbook" }, { status: 500 });
  }
}

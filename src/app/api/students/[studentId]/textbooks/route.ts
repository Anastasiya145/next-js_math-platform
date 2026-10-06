import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  getStudentTextbooks,
  addStudentTextbook,
  deleteStudentTextbook,
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

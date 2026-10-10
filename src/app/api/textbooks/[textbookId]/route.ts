import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { deleteTextbook, updateTextbook } from "@/lib/db";
import { parseTextbookInput } from "@/lib/textbook-input";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ textbookId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const textbookId = Number((await context.params).textbookId);
  const input = parseTextbookInput(
    (await request.json().catch(() => null)) as Record<string, unknown> | null,
  );
  if (!input) {
    return NextResponse.json({ error: errorMessages.textbooks.invalidInput }, { status: 400 });
  }
  if (
    !Number.isInteger(textbookId) ||
    textbookId < 1 ||
    !(await updateTextbook(textbookId, input))
  ) {
    return NextResponse.json({ error: errorMessages.textbooks.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { id: textbookId } });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ textbookId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const textbookId = Number((await context.params).textbookId);
  if (!Number.isInteger(textbookId) || textbookId < 1) {
    return NextResponse.json({ error: errorMessages.textbooks.notFound }, { status: 404 });
  }
  if (!(await deleteTextbook(textbookId))) {
    return NextResponse.json({ error: errorMessages.textbooks.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { id: textbookId } });
}

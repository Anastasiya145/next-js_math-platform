import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { deleteTextbook } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ textbookId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const textbookId = Number((await context.params).textbookId);
  if (!Number.isInteger(textbookId) || textbookId < 1) {
    return NextResponse.json(
      { error: errorMessages.textbooks.notFound },
      { status: 404 },
    );
  }
  if (!(await deleteTextbook(textbookId))) {
    return NextResponse.json(
      { error: errorMessages.textbooks.notFound },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { id: textbookId } });
}

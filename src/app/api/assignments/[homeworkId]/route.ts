import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { deleteHomework } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ homeworkId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const homeworkId = Number((await context.params).homeworkId);
  if (!Number.isInteger(homeworkId) || homeworkId < 1 || !(await deleteHomework(homeworkId))) {
    return NextResponse.json({ error: errorMessages.homework.assignmentNotFound }, { status: 404 });
  }
  return NextResponse.json({ data: { id: homeworkId } });
}

import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { createTextbook, listAllTextbooks } from "@/lib/db";
import { parseTextbookInput } from "@/lib/textbook-input";

export async function GET() {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }
  return NextResponse.json({ data: await listAllTextbooks() });
}

export async function POST(request: Request) {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const input = parseTextbookInput(
    (await request.json().catch(() => null)) as Record<string, unknown> | null,
  );
  if (!input) {
    return NextResponse.json({ error: errorMessages.textbooks.invalidInput }, { status: 400 });
  }

  await createTextbook(input);
  return NextResponse.json({ data: await listAllTextbooks() }, { status: 201 });
}

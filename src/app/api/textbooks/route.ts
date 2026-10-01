import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { createTextbook, listAllTextbooks } from "@/lib/db";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  return NextResponse.json({ data: await listAllTextbooks() });
}

export async function POST(request: Request) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    grade?: unknown;
    subject?: unknown;
    title?: unknown;
    author?: unknown;
    url?: unknown;
    resourceType?: unknown;
  } | null;
  const grade = Number(body?.grade);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const author = typeof body?.author === "string" ? body.author.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const resourceType = body?.resourceType;

  if (
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > 11 ||
    !subject ||
    subject.length > 80 ||
    !title ||
    title.length > 180 ||
    author.length > 160 ||
    !isValidHttpUrl(url) ||
    (resourceType !== "textbook" && resourceType !== "practice")
  ) {
    return NextResponse.json(
      { error: errorMessages.textbooks.invalidInput },
      { status: 400 },
    );
  }

  await createTextbook({ grade, subject, title, author, url, resourceType });
  return NextResponse.json({ data: await listAllTextbooks() }, { status: 201 });
}

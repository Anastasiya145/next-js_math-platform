import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { getTeacherGoogleDriveAccessToken } from "@/lib/google-drive";

export async function GET() {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const token = teacher.email ? await getTeacherGoogleDriveAccessToken(teacher.email) : null;
  return NextResponse.json({ data: { connected: Boolean(token) } });
}

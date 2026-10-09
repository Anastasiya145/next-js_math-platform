import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { getTeacherGoogleDriveAccessToken } from "@/lib/google-drive";

// Hands the teacher's own Drive token to the teacher's browser to open Google Picker.
export async function GET() {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const apiKey = process.env.GOOGLE_PICKER_API_KEY?.trim();
  const appId = process.env.GOOGLE_PROJECT_NUMBER?.trim();
  if (!apiKey || !appId) {
    return NextResponse.json({ error: errorMessages.drive.pickerNotConfigured }, { status: 503 });
  }

  const accessToken = teacher.email ? await getTeacherGoogleDriveAccessToken(teacher.email) : null;
  if (!accessToken) {
    return NextResponse.json({ error: errorMessages.drive.pickerNotConnected }, { status: 503 });
  }

  return NextResponse.json({ data: { accessToken, apiKey, appId } });
}

import { NextResponse } from "next/server";
import { getStudentUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  isStudentTelegramLinked,
  saveStudentTelegramLinkToken,
  unlinkStudentTelegram,
} from "@/lib/db";
import { createLinkToken, telegramBotUsername } from "@/lib/telegram";

const accessDenied = () =>
  NextResponse.json(
    { error: errorMessages.common.accessDenied },
    { status: 403 },
  );

export async function GET() {
  const student = await getStudentUser();
  if (!student) return accessDenied();
  if (!telegramBotUsername) {
    return NextResponse.json({ data: { configured: false, linked: false } });
  }
  try {
    return NextResponse.json({
      data: {
        configured: true,
        linked: await isStudentTelegramLinked(student.studentId),
      },
    });
  } catch (error) {
    console.error("Telegram status error:", error);
    return NextResponse.json(
      { error: errorMessages.telegram.statusFailed },
      { status: 500 },
    );
  }
}

export async function POST() {
  const student = await getStudentUser();
  if (!student) return accessDenied();
  if (!telegramBotUsername) {
    return NextResponse.json(
      { error: errorMessages.telegram.notConfigured },
      { status: 503 },
    );
  }
  try {
    const link = createLinkToken();
    await saveStudentTelegramLinkToken(
      student.studentId,
      link.hash,
      link.expiresAt,
    );
    return NextResponse.json({ data: { url: link.url } });
  } catch (error) {
    console.error("Telegram link error:", error);
    return NextResponse.json(
      { error: errorMessages.telegram.linkFailed },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const student = await getStudentUser();
  if (!student) return accessDenied();
  try {
    await unlinkStudentTelegram(student.studentId);
    return NextResponse.json({ data: { linked: false } });
  } catch (error) {
    console.error("Telegram unlink error:", error);
    return NextResponse.json(
      { error: errorMessages.telegram.unlinkFailed },
      { status: 500 },
    );
  }
}

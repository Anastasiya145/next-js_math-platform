import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  listTelegramHomeworkRecipients,
  unlinkTelegramChat,
  type TelegramHomeworkRecipient,
} from "@/lib/db";
import { formatDue } from "@/lib/format";
import { translate } from "@/lib/language-messages";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
const LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const telegramBotUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";

export const hashLinkToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const isLinkToken = (value: string) => LINK_TOKEN_PATTERN.test(value);

export function createLinkToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    hash: hashLinkToken(token),
    expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS),
    url: `https://t.me/${telegramBotUsername}?start=${token}`,
  };
}

export function isValidWebhookSecret(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(5000),
      },
    );
    // 403: the user blocked the bot, so stop sending to this chat.
    if (response.status === 403) await unlinkTelegramChat(chatId);
    else if (!response.ok)
      console.error("Telegram sendMessage failed:", response.status);
  } catch (error) {
    console.error("Telegram sendMessage error:", error);
  }
}

const dueLine = (recipient: TelegramHomeworkRecipient) =>
  recipient.nextLessonAt || recipient.dueAt
    ? translate(recipient.locale, "due", {
        date: formatDue(
          recipient.nextLessonAt,
          recipient.dueAt,
          recipient.locale,
        ),
      })
    : "";

export async function notifyHomeworkAssigned(
  homeworkId: number,
  studentIds: number[],
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const recipients = await listTelegramHomeworkRecipients(
    homeworkId,
    studentIds,
  );
  await Promise.all(
    recipients.map((recipient) =>
      sendTelegramMessage(
        recipient.chatId,
        [
          translate(recipient.locale, "telegramNewHomework", {
            title: recipient.title,
          }),
          dueLine(recipient),
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ),
  );
}

export async function notifyHomeworkGraded(input: {
  homeworkId: number;
  studentId: number;
  score: number;
  feedback: string;
}): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const recipients = await listTelegramHomeworkRecipients(input.homeworkId, [
    input.studentId,
  ]);
  await Promise.all(
    recipients.map((recipient) =>
      sendTelegramMessage(
        recipient.chatId,
        [
          translate(recipient.locale, "telegramGraded", {
            title: recipient.title,
            score: input.score,
          }),
          input.feedback &&
            translate(recipient.locale, "teacherComment", {
              feedback: input.feedback,
            }),
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ),
  );
}

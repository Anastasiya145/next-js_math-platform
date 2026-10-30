import { NextResponse } from "next/server";
import { getTelegramChatLocale, linkStudentTelegram } from "@/lib/db";
import { translate } from "@/lib/language-messages";
import {
  hashLinkToken,
  isLinkToken,
  isValidWebhookSecret,
  sendTelegramMessage,
} from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    text?: unknown;
    chat?: { id?: unknown; type?: unknown };
  };
};

export async function POST(request: Request) {
  if (
    !isValidWebhookSecret(
      request.headers.get("x-telegram-bot-api-secret-token"),
    )
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request
    .json()
    .catch(() => null)) as TelegramUpdate | null;
  const chat = update?.message?.chat;
  // Only private chats; group messages and other update types are acknowledged and ignored.
  if (chat?.type !== "private" || typeof chat.id !== "number") {
    return NextResponse.json({ ok: true });
  }
  const chatId = String(chat.id);
  const text =
    typeof update?.message?.text === "string" ? update.message.text.trim() : "";
  const [command, token = ""] = text.split(/\s+/, 2);

  if (command === "/start" && token) {
    const linked = isLinkToken(token)
      ? await linkStudentTelegram(hashLinkToken(token), chatId)
      : null;
    const locale = linked?.uiLanguage ?? (await getTelegramChatLocale(chatId));
    await sendTelegramMessage(
      chatId,
      translate(
        locale ?? "uk",
        linked ? "telegramLinked" : "telegramLinkInvalid",
      ),
    );
  } else {
    const locale = await getTelegramChatLocale(chatId);
    await sendTelegramMessage(
      chatId,
      translate(locale ?? "uk", "telegramHelp"),
    );
  }
  return NextResponse.json({ ok: true });
}

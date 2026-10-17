import type { createTextbook } from "@/lib/db";
import { isHttpUrl, isIntegerInRange } from "@/lib/validation";

type TextbookInput = Parameters<typeof createTextbook>[0];

// Validates a textbook request body; returns null when any field is invalid.
export function parseTextbookInput(
  body: Record<string, unknown> | null,
): TextbookInput | null {
  const grade = Number(body?.grade);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const author = typeof body?.author === "string" ? body.author.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const resourceType = body?.resourceType;

  if (
    !isIntegerInRange(grade, 1, 11) ||
    !subject ||
    subject.length > 80 ||
    !title ||
    title.length > 180 ||
    author.length > 160 ||
    !isHttpUrl(url) ||
    (resourceType !== "textbook" && resourceType !== "practice")
  ) {
    return null;
  }
  return { grade, subject, title, author, url, resourceType };
}

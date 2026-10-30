import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  addLanguageTopicMaterial,
  createLanguageTopic,
  deleteLanguageTopic,
  deleteLanguageTopicMaterial,
  listLanguageTopics,
  updateLanguageTopic,
  updateLanguageTopicMaterial,
} from "@/lib/db";
import { isLanguageLevel, isLanguageSection } from "@/lib/language-course";
import { isLanguageCode } from "@/lib/languages";
import { isHttpUrl, isPositiveInteger } from "@/lib/validation";

type PostBody = {
  action?: unknown;
  language?: unknown;
  topicId?: unknown;
  materialId?: unknown;
  level?: unknown;
  section?: unknown;
  title?: unknown;
  description?: unknown;
  name?: unknown;
  url?: unknown;
};

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function readTopic(body: PostBody) {
  const title = text(body.title);
  const description = text(body.description);
  if (
    !isLanguageLevel(body.level) ||
    !isLanguageSection(body.section) ||
    !title ||
    title.length > 160 ||
    description.length > 2000
  ) {
    return null;
  }
  return { level: body.level, section: body.section, title, description };
}

function readMaterial(body: PostBody) {
  const name = text(body.name);
  const url = text(body.url);
  return name && name.length <= 160 && url.length <= 2000 && isHttpUrl(url)
    ? { name, url }
    : null;
}

export async function GET(request: Request) {
  if (!(await getTeacherUser())) {
    return fail(errorMessages.common.accessDenied, 403);
  }
  const language = new URL(request.url).searchParams.get("language");
  if (!isLanguageCode(language)) {
    return fail(errorMessages.languageCourse.invalidLanguage, 400);
  }
  return NextResponse.json({ data: await listLanguageTopics(language) });
}

export async function POST(request: Request) {
  if (!(await getTeacherUser())) {
    return fail(errorMessages.common.accessDenied, 403);
  }
  const body = (await request.json().catch(() => null)) as PostBody | null;
  if (!body) return fail(errorMessages.materials.actionRequired, 400);

  switch (body.action) {
    case "create-topic": {
      const topic = readTopic(body);
      if (!isLanguageCode(body.language)) {
        return fail(errorMessages.languageCourse.invalidLanguage, 400);
      }
      if (!topic) return fail(errorMessages.languageCourse.invalidTopic, 400);
      const id = await createLanguageTopic({
        language: body.language,
        ...topic,
      });
      return NextResponse.json({ data: { id } }, { status: 201 });
    }
    case "update-topic": {
      const topic = readTopic(body);
      if (!topic) return fail(errorMessages.languageCourse.invalidTopic, 400);
      if (
        !isPositiveInteger(body.topicId) ||
        !(await updateLanguageTopic({ topicId: body.topicId, ...topic }))
      ) {
        return fail(errorMessages.languageCourse.topicNotFound, 404);
      }
      return NextResponse.json({ data: { id: body.topicId } });
    }
    case "delete-topic": {
      if (
        !isPositiveInteger(body.topicId) ||
        !(await deleteLanguageTopic(body.topicId))
      ) {
        return fail(errorMessages.languageCourse.topicNotFound, 404);
      }
      return NextResponse.json({ data: { id: body.topicId } });
    }
    case "add-material": {
      const material = readMaterial(body);
      if (!material)
        return fail(errorMessages.languageCourse.invalidMaterial, 400);
      if (
        !isPositiveInteger(body.topicId) ||
        !(await addLanguageTopicMaterial({
          topicId: body.topicId,
          ...material,
        }))
      ) {
        return fail(errorMessages.languageCourse.topicNotFound, 404);
      }
      return NextResponse.json(
        { data: { topicId: body.topicId } },
        { status: 201 },
      );
    }
    case "update-material": {
      const material = readMaterial(body);
      if (!material)
        return fail(errorMessages.languageCourse.invalidMaterial, 400);
      if (
        !isPositiveInteger(body.materialId) ||
        !(await updateLanguageTopicMaterial({
          materialId: body.materialId,
          ...material,
        }))
      ) {
        return fail(errorMessages.languageCourse.materialNotFound, 404);
      }
      return NextResponse.json({ data: { id: body.materialId } });
    }
    case "delete-material": {
      if (
        !isPositiveInteger(body.materialId) ||
        !(await deleteLanguageTopicMaterial(body.materialId))
      ) {
        return fail(errorMessages.languageCourse.materialNotFound, 404);
      }
      return NextResponse.json({ data: { id: body.materialId } });
    }
    default:
      return fail(errorMessages.common.unknownAction, 400);
  }
}

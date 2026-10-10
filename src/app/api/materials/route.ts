import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  addMaterialFile,
  createMaterialClass,
  createMaterialTopic,
  deleteMaterialClass,
  deleteMaterialFile,
  deleteMaterialTopic,
  listMaterialClasses,
  setMaterialClassDriveFolder,
  updateMaterialClass,
  updateMaterialFile,
  updateMaterialTopic,
  type MaterialFileType,
} from "@/lib/db";

const FILE_TYPES: MaterialFileType[] = ["pdf", "doc", "image", "link", "other"];

type PostBody = {
  action?:
    | "add-class"
    | "add-topic"
    | "add-file"
    | "set-drive-folder"
    | "update-class"
    | "update-topic"
    | "update-file"
    | "delete-class"
    | "delete-topic"
    | "delete-file";
  classId?: number;
  className?: string;
  topicId?: number;
  topicTitle?: string;
  fileId?: number;
  driveFolderUrl?: string;
  file?: { name?: string; url?: string; type?: MaterialFileType };
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

// Class names carry the grade number (e.g. "8 клас"), which drives the sort order.
const parseClassName = (raw: string | undefined) => {
  const name = raw?.trim();
  if (!name) return { error: errorMessages.materials.classNameRequired };
  const grade = Number(name.match(/\d{1,2}/)?.[0]);
  if (!(grade >= 1 && grade <= 11) || name.length > 120) {
    return { error: errorMessages.materials.classGradeRequired };
  }
  return { name, grade };
};

const parseFile = (file: PostBody["file"]) => {
  const name = file?.name?.trim();
  const url = file?.url?.trim();
  if (!name || name.length > 160 || !url || !isValidHttpUrl(url)) return null;
  const type = file?.type && FILE_TYPES.includes(file.type) ? file.type : "link";
  return { name, url, type };
};

export async function GET() {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }
  return NextResponse.json({ data: await listMaterialClasses() });
}

export async function POST(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as PostBody | null;

  if (!body?.action) {
    return NextResponse.json({ error: errorMessages.materials.actionRequired }, { status: 400 });
  }

  if (body.action === "add-class") {
    const parsed = parseClassName(body.className);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    await createMaterialClass({ ...parsed, createdBy: teacher.email ?? "" });
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  }

  if (!isId(body.classId)) {
    return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
  }
  const classId = body.classId;

  if (body.action === "update-class") {
    const parsed = parseClassName(body.className);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (!(await updateMaterialClass({ classId, ...parsed }))) {
      return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: classId } });
  }

  if (body.action === "delete-class") {
    if (!(await deleteMaterialClass(classId))) {
      return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: classId } });
  }

  if (body.action === "set-drive-folder") {
    const url = body.driveFolderUrl?.trim() ?? "";
    if (url && !isValidHttpUrl(url)) {
      return NextResponse.json({ error: errorMessages.materials.invalidUrl }, { status: 400 });
    }
    if (!(await setMaterialClassDriveFolder(classId, url))) {
      return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: classId } });
  }

  if (body.action === "add-topic") {
    const title = body.topicTitle?.trim();
    if (!title || title.length > 160) {
      return NextResponse.json(
        { error: errorMessages.materials.topicTitleRequired },
        { status: 400 },
      );
    }
    if (!(await createMaterialTopic(classId, title))) {
      return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  }

  if (!isId(body.topicId)) {
    return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
  }
  const topicId = body.topicId;

  if (body.action === "add-file") {
    const file = parseFile(body.file);
    if (!file) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNameAndUrlRequired },
        { status: 400 },
      );
    }
    if (!(await addMaterialFile({ classId, topicId, ...file }))) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  }

  if (body.action === "update-topic") {
    const title = body.topicTitle?.trim();
    if (!title || title.length > 160) {
      return NextResponse.json(
        { error: errorMessages.materials.topicTitleRequired },
        { status: 400 },
      );
    }
    if (!(await updateMaterialTopic({ classId, topicId, title }))) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: topicId } });
  }

  if (body.action === "update-file") {
    const file = parseFile(body.file);
    if (!file) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNameAndUrlRequired },
        { status: 400 },
      );
    }
    const fileId = body.fileId;
    if (!isId(fileId) || !(await updateMaterialFile({ classId, topicId, fileId, ...file }))) {
      return NextResponse.json({ error: errorMessages.materials.fileNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: fileId } });
  }

  if (body.action === "delete-topic") {
    if (!(await deleteMaterialTopic(classId, topicId))) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: topicId } });
  }

  if (body.action === "delete-file") {
    const fileId = body.fileId;
    if (!isId(fileId) || !(await deleteMaterialFile({ classId, topicId, fileId }))) {
      return NextResponse.json({ error: errorMessages.materials.fileNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { id: fileId } });
  }

  return NextResponse.json({ error: errorMessages.common.unknownAction }, { status: 400 });
}

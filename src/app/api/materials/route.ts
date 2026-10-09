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
  type MaterialFileType,
} from "@/lib/db";

const FILE_TYPES: MaterialFileType[] = ["pdf", "doc", "image", "link", "other"];

type PostBody = {
  action?:
    | "add-class"
    | "add-topic"
    | "add-file"
    | "set-drive-folder"
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
    const name = body.className?.trim();
    if (!name) {
      return NextResponse.json(
        { error: errorMessages.materials.classNameRequired },
        { status: 400 },
      );
    }
    const grade = Number(name.match(/\d{1,2}/)?.[0]);
    if (!(grade >= 1 && grade <= 11) || name.length > 120) {
      return NextResponse.json(
        { error: errorMessages.materials.classGradeRequired },
        { status: 400 },
      );
    }
    await createMaterialClass({ name, grade, createdBy: teacher.email ?? "" });
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
  }

  if (!isId(body.classId)) {
    return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
  }
  const classId = body.classId;

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
    const name = body.file?.name?.trim();
    const url = body.file?.url?.trim();
    if (!name || name.length > 160 || !url || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNameAndUrlRequired },
        { status: 400 },
      );
    }
    const type = body.file?.type && FILE_TYPES.includes(body.file.type) ? body.file.type : "link";
    if (!(await addMaterialFile({ classId, topicId, name, url, type }))) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    return NextResponse.json({ data: { ok: true } }, { status: 201 });
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

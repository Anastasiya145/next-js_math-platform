import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import {
  listNushTopicsForGrade,
  createNushTopic,
  getNushTopicMaterials,
  addNushTopicMaterial,
  deleteNushTopic,
  deleteNushTopicMaterial,
  updateNushTopic,
  updateNushTopicMaterial,
} from "@/lib/db";
import { NUSH_SPLIT_GRADE, isSplitSubject } from "@/lib/nush";
import {
  isHttpUrl,
  isIntegerInRange,
  isPositiveInteger,
} from "@/lib/validation";

type PostBody = {
  action?:
    | "list"
    | "create-topic"
    | "update-topic"
    | "add-material"
    | "update-material"
    | "delete-material"
    | "delete-topic";
  grade?: number;
  subject?: string;
  topicId?: number;
  title?: string;
  description?: string;
  material?: {
    name?: string;
    url?: string;
    materialType?: string;
  };
  materialId?: number;
};

const MATERIAL_TYPES = [
  "google_drive",
  "naurok",
  "pdf",
  "doc",
  "link",
  "other",
] as const;

export async function GET(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");
  const topicId = searchParams.get("topicId");

  const gradeNum = Number(grade);
  if (!isIntegerInRange(gradeNum, 1, 11)) {
    return NextResponse.json(
      { error: errorMessages.materials.invalidGrade },
      { status: 400 },
    );
  }

  if (topicId) {
    const topicIdNum = Number(topicId);
    if (!isPositiveInteger(topicIdNum)) {
      return NextResponse.json(
        { error: errorMessages.common.invalidId },
        { status: 400 },
      );
    }
    const materials = await getNushTopicMaterials(topicIdNum);
    return NextResponse.json({ data: materials });
  }

  const topics = await listNushTopicsForGrade(gradeNum);
  return NextResponse.json({ data: topics });
}

export async function POST(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;

  if (!body?.action) {
    return NextResponse.json(
      { error: errorMessages.materials.actionRequired },
      { status: 400 },
    );
  }

  if (body.action === "create-topic") {
    const grade = body.grade;
    const title = body.title?.trim();
    const description = body.description?.trim() ?? "";

    if (!isIntegerInRange(grade, 1, 11) || !title) {
      return NextResponse.json(
        { error: errorMessages.materials.topicGradeAndTitleRequired },
        { status: 400 },
      );
    }

    const split = grade >= NUSH_SPLIT_GRADE;
    if (split && !isSplitSubject(body.subject)) {
      return NextResponse.json(
        { error: errorMessages.materials.invalidSubject },
        { status: 400 },
      );
    }

    try {
      const topic = await createNushTopic({
        grade,
        subject: isSplitSubject(body.subject) && split ? body.subject : "math",
        title,
        description,
        createdBy: teacher.email ?? "unknown",
      });
      return NextResponse.json({ data: topic }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: errorMessages.materials.topicCreateFailed },
        { status: 500 },
      );
    }
  }

  if (body.action === "add-material") {
    const topicId = body.topicId;
    const name = body.material?.name?.trim();
    const url = body.material?.url?.trim();
    const materialType = MATERIAL_TYPES.find(
      (type) => type === body.material?.materialType,
    );

    if (!isPositiveInteger(topicId) || !name || !url || !isHttpUrl(url)) {
      return NextResponse.json(
        { error: errorMessages.materials.topicMaterialRequired },
        { status: 400 },
      );
    }
    if (!materialType) {
      return NextResponse.json(
        { error: errorMessages.materials.invalidType },
        { status: 400 },
      );
    }

    try {
      const material = await addNushTopicMaterial({
        topicId,
        name,
        url,
        materialType,
      });
      return NextResponse.json({ data: material }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: errorMessages.materials.materialAddFailed },
        { status: 500 },
      );
    }
  }

  if (body.action === "update-topic") {
    const title = body.title?.trim();
    const description = body.description?.trim() ?? "";
    if (!title || title.length > 160) {
      return NextResponse.json(
        { error: errorMessages.materials.topicTitleRequired },
        { status: 400 },
      );
    }
    if (body.subject !== undefined && !isSplitSubject(body.subject)) {
      return NextResponse.json(
        { error: errorMessages.materials.invalidSubject },
        { status: 400 },
      );
    }
    const updated =
      isPositiveInteger(body.topicId) &&
      (await updateNushTopic({
        topicId: Number(body.topicId),
        title,
        description,
        subject: isSplitSubject(body.subject) ? body.subject : undefined,
      }));
    if (!updated) {
      return NextResponse.json(
        { error: errorMessages.materials.topicNotFound },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: { id: body.topicId } });
  }

  if (body.action === "update-material") {
    const name = body.material?.name?.trim();
    const url = body.material?.url?.trim();
    const materialType = MATERIAL_TYPES.find(
      (type) => type === body.material?.materialType,
    );
    if (!name || name.length > 160 || !url || !isHttpUrl(url)) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNameAndUrlRequired },
        { status: 400 },
      );
    }
    if (!materialType) {
      return NextResponse.json(
        { error: errorMessages.materials.invalidType },
        { status: 400 },
      );
    }
    const updated =
      isPositiveInteger(body.materialId) &&
      (await updateNushTopicMaterial({
        materialId: Number(body.materialId),
        name,
        url,
        materialType,
      }));
    if (!updated) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNotFound },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: { id: body.materialId } });
  }

  if (body.action === "delete-material") {
    const materialId = body.materialId;
    if (!materialId) {
      return NextResponse.json(
        { error: errorMessages.common.invalidId },
        { status: 400 },
      );
    }

    try {
      await deleteNushTopicMaterial(materialId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: errorMessages.materials.deleteFailed },
        { status: 500 },
      );
    }
  }

  if (body.action === "delete-topic") {
    if (!body.topicId) {
      return NextResponse.json(
        { error: errorMessages.materials.topicNotFound },
        { status: 400 },
      );
    }

    try {
      await deleteNushTopic(body.topicId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: errorMessages.materials.deleteFailed },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: errorMessages.common.unknownAction },
    { status: 400 },
  );
}

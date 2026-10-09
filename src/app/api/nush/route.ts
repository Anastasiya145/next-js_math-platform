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
} from "@/lib/db";

type PostBody = {
  action?: "list" | "create-topic" | "add-material" | "delete-material" | "delete-topic";
  grade?: number;
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

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export async function GET(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");
  const topicId = searchParams.get("topicId");

  if (!grade) {
    return NextResponse.json({ error: "Grade parameter required" }, { status: 400 });
  }

  const gradeNum = parseInt(grade, 10);
  if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 11) {
    return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
  }

  if (topicId) {
    const topicIdNum = parseInt(topicId, 10);
    const materials = await getNushTopicMaterials(topicIdNum);
    return NextResponse.json({ data: materials });
  }

  const topics = await listNushTopicsForGrade(gradeNum);
  return NextResponse.json({ data: topics });
}

export async function POST(request: Request) {
  const teacher = await getTeacherUser();
  if (!teacher) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PostBody | null;

  if (!body?.action) {
    return NextResponse.json({ error: "Action required" }, { status: 400 });
  }

  if (body.action === "create-topic") {
    const grade = body.grade;
    const title = body.title?.trim();
    const description = body.description?.trim() ?? "";

    if (!grade || grade < 1 || grade > 11 || !title) {
      return NextResponse.json({ error: "Grade and title required" }, { status: 400 });
    }

    try {
      const topic = await createNushTopic({
        grade,
        title,
        description,
        createdBy: teacher.email ?? "unknown",
      });
      return NextResponse.json({ data: topic }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
    }
  }

  if (body.action === "add-material") {
    const topicId = body.topicId;
    const name = body.material?.name?.trim();
    const url = body.material?.url?.trim();
    const materialType = body.material?.materialType;

    if (!topicId || !name || !url || !materialType || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: "Topic ID, name, URL, and type required" },
        { status: 400 },
      );
    }

    const validTypes = ["google_drive", "naurok", "pdf", "doc", "link", "other"];
    if (!validTypes.includes(materialType)) {
      return NextResponse.json({ error: "Invalid material type" }, { status: 400 });
    }

    try {
      const material = await addNushTopicMaterial({
        topicId,
        name,
        url,
        materialType: materialType as any,
      });
      return NextResponse.json({ data: material }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Failed to add material" }, { status: 500 });
    }
  }

  if (body.action === "delete-material") {
    const materialId = body.materialId;
    if (!materialId) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 });
    }

    try {
      await deleteNushTopicMaterial(materialId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }
  }

  if (body.action === "delete-topic") {
    if (!body.topicId) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 400 });
    }

    try {
      await deleteNushTopic(body.topicId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: errorMessages.materials.deleteFailed }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

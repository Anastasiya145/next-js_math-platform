import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";

type FileType = "pdf" | "doc" | "image" | "link" | "other";

type MaterialFile = {
  id: string;
  name: string;
  url: string;
  type: FileType;
  addedAt: string;
};

type Topic = {
  id: string;
  title: string;
  files: MaterialFile[];
};

type ClassFolder = {
  id: string;
  className: string;
  driveFolderUrl?: string;
  topics: Topic[];
};

let nextId = 100;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

const classes: ClassFolder[] = [
  {
    id: "class-4",
    className: "4 клас",
    driveFolderUrl: "",
    topics: [
      {
        id: "topic-4-entry",
        title: "Вступний тест",
        files: [
          {
            id: "file-4-entry-1",
            name: "Вступний тест — 4 клас.pdf",
            url: "https://drive.google.com/drive/folders/example-4-entry",
            type: "pdf",
            addedAt: "2026-09-01",
          },
        ],
      },
    ],
  },
  {
    id: "class-5",
    className: "7 клас",
    driveFolderUrl: "",
    topics: [
      {
        id: "topic-5-fractions",
        title: "Лінійні рівняння",
        files: [],
      },
    ],
  },
  {
    id: "class-6",
    className: "9 клас",
    driveFolderUrl: "",
    topics: [
      {
        id: "topic-6-percent",
        title: "Відсотки",
        files: [],
      },
    ],
  },
];

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export async function GET() {
  if (!(await getTeacherUser())) {
    return NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });
  }
  return NextResponse.json({ data: classes });
}

type PostBody = {
  action?:
    | "add-class"
    | "add-topic"
    | "add-file"
    | "set-drive-folder"
    | "delete-class"
    | "delete-topic"
    | "delete-file";
  classId?: string;
  className?: string;
  topicId?: string;
  topicTitle?: string;
  fileId?: string;
  driveFolderUrl?: string;
  file?: { name?: string; url?: string; type?: FileType };
};

export async function POST(request: Request) {
  if (!(await getTeacherUser())) {
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
    const created: ClassFolder = {
      id: genId("class"),
      className: name,
      driveFolderUrl: "",
      topics: [],
    };
    classes.push(created);
    return NextResponse.json({ data: created }, { status: 201 });
  }

  const klass = classes.find((c) => c.id === body.classId);
  if (!klass) {
    return NextResponse.json({ error: errorMessages.materials.classNotFound }, { status: 404 });
  }

  if (body.action === "delete-class") {
    classes.splice(classes.indexOf(klass), 1);
    return NextResponse.json({ data: { id: klass.id } });
  }

  if (body.action === "set-drive-folder") {
    const url = body.driveFolderUrl?.trim() ?? "";
    if (url && !isValidHttpUrl(url)) {
      return NextResponse.json({ error: errorMessages.materials.invalidUrl }, { status: 400 });
    }
    klass.driveFolderUrl = url;
    return NextResponse.json({ data: klass });
  }

  if (body.action === "add-topic") {
    const title = body.topicTitle?.trim();
    if (!title) {
      return NextResponse.json(
        { error: errorMessages.materials.topicTitleRequired },
        { status: 400 },
      );
    }
    const topic: Topic = { id: genId("topic"), title, files: [] };
    klass.topics.push(topic);
    return NextResponse.json({ data: topic }, { status: 201 });
  }

  if (body.action === "add-file") {
    const topic = klass.topics.find((t) => t.id === body.topicId);
    if (!topic) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    const name = body.file?.name?.trim();
    const url = body.file?.url?.trim();
    if (!name || !url || !isValidHttpUrl(url)) {
      return NextResponse.json(
        { error: errorMessages.materials.fileNameAndUrlRequired },
        { status: 400 },
      );
    }
    const type: FileType =
      body.file?.type && ["pdf", "doc", "image", "link", "other"].includes(body.file.type)
        ? body.file.type
        : "link";
    const file: MaterialFile = {
      id: genId("file"),
      name,
      url,
      type,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    topic.files.push(file);
    return NextResponse.json({ data: file }, { status: 201 });
  }

  if (body.action === "delete-topic") {
    const topicIndex = klass.topics.findIndex((t) => t.id === body.topicId);
    if (topicIndex < 0) {
      return NextResponse.json({ error: errorMessages.materials.topicNotFound }, { status: 404 });
    }
    klass.topics.splice(topicIndex, 1);
    return NextResponse.json({ data: { id: body.topicId } });
  }

  if (body.action === "delete-file") {
    const topic = klass.topics.find((t) => t.id === body.topicId);
    const fileIndex = topic?.files.findIndex((f) => f.id === body.fileId) ?? -1;
    if (!topic || fileIndex < 0) {
      return NextResponse.json({ error: errorMessages.materials.fileNotFound }, { status: 404 });
    }
    topic.files.splice(fileIndex, 1);
    return NextResponse.json({ data: { id: body.fileId } });
  }

  return NextResponse.json({ error: errorMessages.common.unknownAction }, { status: 400 });
}

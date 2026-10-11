// From this grade the NUSH math course is split into algebra and geometry.
export const NUSH_SPLIT_GRADE = 7;

export type NushSubject = "math" | "algebra" | "geometry";

export const NUSH_SUBJECT_LABELS: Record<NushSubject, string> = {
  math: "Математика",
  algebra: "Алгебра",
  geometry: "Геометрія",
};

export const NUSH_SPLIT_SUBJECTS = ["algebra", "geometry"] as const satisfies NushSubject[];

export const isSplitSubject = (value: unknown): value is (typeof NUSH_SPLIT_SUBJECTS)[number] =>
  NUSH_SPLIT_SUBJECTS.some((subject) => subject === value);

// "Алгебра: Лінійні рівняння" for the split grades, the bare title for the single math course.
export const formatTopic = (topic: { title: string; subject: NushSubject }) =>
  topic.subject === "math" ? topic.title : `${NUSH_SUBJECT_LABELS[topic.subject]}: ${topic.title}`;

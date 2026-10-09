import { notFound } from "next/navigation";
import { StudentCabinet } from "@/app/student/StudentCabinet";

export default async function StudentViewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const studentId = Number((await params).studentId);
  if (!Number.isInteger(studentId) || studentId < 1) notFound();
  return <StudentCabinet studentId={studentId} />;
}

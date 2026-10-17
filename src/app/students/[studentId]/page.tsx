import { notFound } from "next/navigation";
import { StudentCabinet } from "@/app/student/StudentCabinet";
import { isPositiveInteger } from "@/lib/validation";

export default async function StudentViewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const studentId = Number((await params).studentId);
  if (!isPositiveInteger(studentId)) notFound();
  return <StudentCabinet studentId={studentId} />;
}

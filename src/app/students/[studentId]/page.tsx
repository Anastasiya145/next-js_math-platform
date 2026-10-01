import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStudentById, getStudentProgress } from "@/lib/db";
import { Sidebar } from "../../components/Sidebar";
import { router } from "../../router";
import { ProgressChart } from "./ProgressChart";

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "teacher") redirect(router.home.href);

  const { studentId: rawStudentId } = await params;
  const studentId = Number(rawStudentId);
  if (!Number.isInteger(studentId) || studentId < 1) notFound();

  const student = await getStudentById(studentId);
  if (!student) notFound();
  const progress = await getStudentProgress(student.id);

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="student-progress">
        <header className="topbar">
          <div>
            <p className="eyebrow">{student.grade} КЛАС</p>
            <h1>Прогрес: {student.name}</h1>
          </div>
        </header>
        <Link
          className="text-button student-progress-back"
          href={router.students.href}
        >
          До списку учнів
        </Link>
        <ProgressChart
          studentId={student.id}
          studentName={student.name}
          points={progress}
        />
      </section>
    </main>
  );
}

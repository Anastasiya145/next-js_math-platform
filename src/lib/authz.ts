import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getStudentUser() {
  const user = await getCurrentUser();
  if (user?.role !== "student" || typeof user.studentId !== "number") {
    return null;
  }
  return { ...user, studentId: user.studentId };
}

export async function getTeacherUser() {
  const user = await getCurrentUser();
  return user?.role === "teacher" ? user : null;
}

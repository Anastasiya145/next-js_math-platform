import { auth } from "@/auth";
import { siteVariant } from "@/lib/site-variant";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getStudentUser() {
  const user = await getCurrentUser();
  if (
    user?.role !== "student" ||
    user.siteType !== siteVariant ||
    typeof user.studentId !== "number"
  ) {
    return null;
  }
  return { ...user, studentId: user.studentId };
}

export async function getTeacherUser() {
  const user = await getCurrentUser();
  return siteVariant === "math" && user?.role === "teacher" ? user : null;
}

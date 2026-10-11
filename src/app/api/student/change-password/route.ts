import { getStudentUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { validatePassword } from "@/lib/validation";
import { findStudentAccount, updateStudentPassword } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export async function POST(req: Request) {
  const student = await getStudentUser();
  if (!student?.email) {
    return Response.json({ error: errorMessages.auth.accessDenied }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  } | null;
  if (
    typeof body?.currentPassword !== "string" ||
    typeof body.newPassword !== "string" ||
    typeof body.confirmPassword !== "string"
  ) {
    return Response.json({ error: errorMessages.students.passwordMustBeText }, { status: 400 });
  }

  const passwordError = validatePassword(body.newPassword);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }
  if (body.newPassword !== body.confirmPassword) {
    return Response.json({ error: errorMessages.students.passwordsMismatch }, { status: 400 });
  }

  try {
    // A signed-in session alone is not enough to change the password of an unattended device.
    const account = await findStudentAccount(student.email);
    if (
      !account ||
      !verifyPassword(body.currentPassword, account.password_salt, account.password_hash)
    ) {
      return Response.json({ error: errorMessages.auth.currentPasswordInvalid }, { status: 400 });
    }

    const { salt, hash } = hashPassword(body.newPassword);
    await updateStudentPassword(student.studentId, salt, hash);
    return Response.json({ data: { updated: true } });
  } catch (error) {
    console.error("Password change error:", error);
    return Response.json({ error: errorMessages.auth.passwordChangeFailed }, { status: 500 });
  }
}

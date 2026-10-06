import { auth } from "@/auth";
import { getStudentUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { validatePassword } from "@/lib/validation";
import { updateStudentPassword } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";

export async function POST(req: Request) {
  try {
    const student = await getStudentUser();
    if (!student) {
      return Response.json({ error: errorMessages.auth.accessDenied }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return Response.json({ error: "Паролі не співпадають." }, { status: 400 });
    }

    // Update password in database
    const { salt, hash } = hashPassword(newPassword);
    await updateStudentPassword(student.studentId!, salt, hash);

    return Response.json({ success: true, message: "Пароль успішно змінено." });
  } catch (error) {
    console.error("Password change error:", error);
    return Response.json({ error: errorMessages.common.actionFailed }, { status: 500 });
  }
}

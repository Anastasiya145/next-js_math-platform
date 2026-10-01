import { NextResponse } from "next/server";
import {
  deleteStudent,
  listStudentsWithEmail,
  createStudentAccount,
  updateStudent,
} from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { getTeacherUser } from "@/lib/authz";
import { errorMessages } from "@/lib/error-messages";
import { validateEmail, validatePassword } from "@/lib/validation";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET() {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  return NextResponse.json({ data: await listStudentsWithEmail() });
}

export async function POST(request: Request) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    grade?: number;
    email?: string;
    temporaryPassword?: string;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const grade = Number(body?.grade);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const temporaryPassword =
    typeof body?.temporaryPassword === "string" ? body.temporaryPassword : "";
  const fieldErrors = {
    name: !name
      ? errorMessages.students.nameRequired
      : name.length > 120
        ? errorMessages.students.nameTooLong
        : undefined,
    grade:
      !Number.isInteger(grade) || grade < 1 || grade > 11
        ? errorMessages.students.gradeRange
        : undefined,
    email: validateEmail(email) ?? undefined,
    temporaryPassword: validatePassword(temporaryPassword) ?? undefined,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return NextResponse.json(
      {
          error: errorMessages.students.invalidCredentials,
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const password = hashPassword(temporaryPassword);
  try {
    const student = await createStudentAccount({
      name,
      grade,
      email,
      passwordSalt: password.salt,
      passwordHash: password.hash,
    });
    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        {
          error: errorMessages.students.duplicateEmail,
          fieldErrors: { email: errorMessages.students.duplicateEmailField },
        },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { error: errorMessages.students.invalidId },
      { status: 400 },
    );
  }

  await deleteStudent(id);
  return NextResponse.json({ data: { id } });
}

export async function PATCH(request: Request) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }
  const { searchParams } = new URL(request.url);
  const studentId = Number(searchParams.get("id"));
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    grade?: number;
    email?: string;
    temporaryPassword?: string;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const grade = Number(body?.grade);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const temporaryPassword =
    typeof body?.temporaryPassword === "string" ? body.temporaryPassword : "";
  const fieldErrors = {
    name: !name
      ? errorMessages.students.nameRequired
      : name.length > 120
        ? errorMessages.students.nameTooLong
        : undefined,
    grade:
      !Number.isInteger(grade) || grade < 1 || grade > 11
        ? errorMessages.students.gradeRange
        : undefined,
    email:
      (body?.email !== undefined && typeof body.email !== "string"
        ? errorMessages.students.emailMustBeText
        : validateEmail(email, false)) ?? undefined,
    temporaryPassword:
      (body?.temporaryPassword !== undefined &&
      typeof body.temporaryPassword !== "string"
        ? errorMessages.students.passwordMustBeText
        : validatePassword(temporaryPassword, false)) ?? undefined,
  };

  if (
    !Number.isInteger(studentId) ||
    studentId < 1 ||
    Object.values(fieldErrors).some(Boolean)
  ) {
    return NextResponse.json(
      {
        error: errorMessages.students.invalidProfile,
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const password = temporaryPassword ? hashPassword(temporaryPassword) : null;
  try {
    const student = await updateStudent({
      studentId,
      name,
      grade,
      email,
      passwordSalt: password?.salt,
      passwordHash: password?.hash,
    });
    if (!student) {
      return NextResponse.json(
        { error: errorMessages.students.notFound },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: student });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        {
          error: errorMessages.students.duplicateEmail,
          fieldErrors: { email: errorMessages.students.duplicateEmailField },
        },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      error.message === errorMessages.database.temporaryPasswordRequired
    ) {
      return NextResponse.json(
        { error: errorMessages.students.temporaryPasswordRequired },
        { status: 400 },
      );
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { createPayment, deletePayment, listPayments, updatePayment } from "@/lib/db";
import { errorMessages } from "@/lib/error-messages";
import { MAX_PAYMENT_NOTE_LENGTH, isPaymentAmount } from "@/lib/payments";
import { MAX_RANGE_DAYS, addDays, isDateString } from "@/lib/schedule";

type PaymentBody = {
  id?: unknown;
  studentId?: unknown;
  paidOn?: unknown;
  amount?: unknown;
  note?: unknown;
};

const denied = () =>
  NextResponse.json({ error: errorMessages.common.accessDenied }, { status: 403 });

const invalid = () =>
  NextResponse.json({ error: errorMessages.payments.invalidPayment }, { status: 400 });

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// Validates the fields shared by create and update; returns null when any is wrong.
const parseFields = (body: PaymentBody | null) => {
  const note = body?.note === undefined ? "" : body.note;
  if (
    typeof body?.paidOn !== "string" ||
    !isDateString(body.paidOn) ||
    !isPaymentAmount(body.amount) ||
    typeof note !== "string" ||
    note.trim().length > MAX_PAYMENT_NOTE_LENGTH
  ) {
    return null;
  }
  return { paidOn: body.paidOn, amount: body.amount, note: note.trim() };
};

export async function GET(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (
    !isDateString(from) ||
    !isDateString(to) ||
    from >= to ||
    to > addDays(from, MAX_RANGE_DAYS)
  ) {
    return NextResponse.json({ error: errorMessages.payments.invalidRange }, { status: 400 });
  }

  return NextResponse.json({ data: await listPayments({ from, to }) });
}

// Records money received from a student's parents.
export async function POST(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const body = (await request.json().catch(() => null)) as PaymentBody | null;
  const fields = parseFields(body);
  if (!fields || !isId(body?.studentId)) return invalid();

  if (!(await createPayment({ studentId: body.studentId, ...fields }))) {
    return NextResponse.json({ error: errorMessages.students.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { created: true } }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const body = (await request.json().catch(() => null)) as PaymentBody | null;
  const fields = parseFields(body);
  if (!fields || !isId(body?.id)) return invalid();

  if (!(await updatePayment({ id: body.id, ...fields }))) {
    return NextResponse.json({ error: errorMessages.payments.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(request: Request) {
  if (!(await getTeacherUser())) return denied();

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!isId(id)) return invalid();

  if (!(await deletePayment(id))) {
    return NextResponse.json({ error: errorMessages.payments.notFound }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true } });
}

import { NextResponse } from "next/server";
import { getTeacherUser } from "@/lib/authz";
import { setStudentSchedule } from "@/lib/db";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_HOURLY_RATE,
  MAX_LESSON_MINUTES,
  MAX_SLOTS_PER_STUDENT,
  MIN_LESSON_MINUTES,
  isDateString,
  isTimeString,
} from "@/lib/schedule";
import { isIntegerInRange, isPositiveInteger } from "@/lib/validation";

type SlotInput = {
  weekday: number;
  startTime: string;
  durationMinutes: number;
};

const isSlot = (value: unknown): value is SlotInput => {
  const slot = value as Partial<SlotInput> | null;
  return (
    typeof slot === "object" &&
    slot !== null &&
    isIntegerInRange(slot.weekday, 1, 7) &&
    typeof slot.startTime === "string" &&
    isTimeString(slot.startTime) &&
    isIntegerInRange(
      slot.durationMinutes,
      MIN_LESSON_MINUTES,
      MAX_LESSON_MINUTES,
    )
  );
};

// Replaces the student's hourly rate and weekly lesson slots.
export async function PUT(
  request: Request,
  context: { params: Promise<{ studentId: string }> },
) {
  if (!(await getTeacherUser())) {
    return NextResponse.json(
      { error: errorMessages.common.accessDenied },
      { status: 403 },
    );
  }

  const studentId = Number((await context.params).studentId);
  const body = (await request.json().catch(() => null)) as {
    hourlyRate?: unknown;
    startsOn?: unknown;
    slots?: unknown;
  } | null;
  const slots = body?.slots;
  const times = Array.isArray(slots) ? slots.filter(isSlot) : [];
  if (
    !isPositiveInteger(studentId) ||
    !isIntegerInRange(body?.hourlyRate, 0, MAX_HOURLY_RATE) ||
    typeof body.startsOn !== "string" ||
    !isDateString(body.startsOn) ||
    !Array.isArray(slots) ||
    slots.length > MAX_SLOTS_PER_STUDENT ||
    times.length !== slots.length ||
    new Set(times.map((slot) => `${slot.weekday}|${slot.startTime}`)).size !==
      times.length
  ) {
    return NextResponse.json(
      { error: errorMessages.schedule.invalidSchedule },
      { status: 400 },
    );
  }

  const saved = await setStudentSchedule({
    studentId,
    hourlyRate: body.hourlyRate,
    startsOn: body.startsOn,
    slots: times,
  });
  if (!saved) {
    return NextResponse.json(
      { error: errorMessages.students.notFound },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { saved: true } });
}

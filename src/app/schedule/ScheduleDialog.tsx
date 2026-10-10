"use client";

import { useState } from "react";
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import {
  DEFAULT_LESSON_MINUTES,
  MAX_HOURLY_RATE,
  MAX_LESSON_MINUTES,
  MAX_SLOTS_PER_STUDENT,
  MIN_LESSON_MINUTES,
  WEEKDAY_NAMES,
  isDateString,
  isTimeString,
  todayKyiv,
  type ScheduleStudent,
} from "@/lib/schedule";
import { FormDialog } from "@/components/FormDialog";
import { router } from "../router";

type SlotDraft = { key: number; weekday: string; startTime: string; durationMinutes: string };

type Props = {
  student: ScheduleStudent;
  onSaved: () => Promise<unknown>;
  onClose: () => void;
};

const isWholeNumber = (value: string, min: number, max: number) =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

// Edits the hourly rate and the weekly lesson slots of one student.
export function ScheduleDialog({ student, onSaved, onClose }: Props) {
  const activeSlots = student.slots.filter((slot) => slot.endsOn === null);
  const [rate, setRate] = useState(student.hourlyRate ? String(student.hourlyRate) : "");
  const [rateTouched, setRateTouched] = useState(false);
  // Changes apply from this date; lessons before it stay as they were.
  const [startsOn, setStartsOn] = useState(() => {
    const today = todayKyiv();
    return activeSlots.length > 0 ? today : `${today.slice(0, 7)}-01`;
  });
  const [nextKey, setNextKey] = useState(activeSlots.length);
  const [slots, setSlots] = useState<SlotDraft[]>(() =>
    activeSlots.map((slot, index) => ({
      key: index,
      weekday: String(slot.weekday),
      startTime: slot.startTime,
      durationMinutes: String(slot.durationMinutes),
    })),
  );

  const rateError = isWholeNumber(rate, 0, MAX_HOURLY_RATE)
    ? null
    : errorMessages.schedule.rateRange;
  const startsOnError = isDateString(startsOn) ? null : errorMessages.schedule.startsOnRequired;
  const seen = new Set<string>();
  const slotErrors = slots.map((slot) => {
    if (!isTimeString(slot.startTime)) return { time: errorMessages.schedule.slotTimeRequired };
    if (!isWholeNumber(slot.durationMinutes, MIN_LESSON_MINUTES, MAX_LESSON_MINUTES)) {
      return { duration: errorMessages.schedule.slotDurationRange };
    }
    const id = `${slot.weekday}|${slot.startTime}`;
    if (seen.has(id)) return { time: errorMessages.schedule.slotDuplicate };
    seen.add(id);
    return {};
  });
  const invalid =
    Boolean(rateError) ||
    Boolean(startsOnError) ||
    slotErrors.some((error) => Object.keys(error).length > 0);

  const updateSlot = (key: number, patch: Partial<SlotDraft>) =>
    setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));

  const addSlot = () => {
    setSlots((current) => [
      ...current,
      {
        key: nextKey,
        weekday: "1",
        startTime: "16:00",
        durationMinutes: String(DEFAULT_LESSON_MINUTES),
      },
    ]);
    setNextKey(nextKey + 1);
  };

  const submit = async () => {
    await api(router.api.studentSchedule(student.id), {
      method: "PUT",
      body: {
        hourlyRate: Number(rate),
        startsOn,
        slots: slots.map((slot) => ({
          weekday: Number(slot.weekday),
          startTime: slot.startTime,
          durationMinutes: Number(slot.durationMinutes),
        })),
      },
      fallback: errorMessages.schedule.saveFailed,
    });
    await onSaved();
  };

  return (
    <FormDialog
      title={`Розклад: ${student.name}`}
      submitLabel="Зберегти"
      submitDisabled={invalid}
      onSubmit={submit}
      onClose={onClose}
    >
      <TextField
        label="Ставка за годину, грн"
        required
        value={rate}
        onChange={(event) => setRate(event.target.value.trim())}
        onBlur={() => setRateTouched(true)}
        error={rateTouched && Boolean(rateError)}
        helperText={
          rateTouched && rateError
            ? rateError
            : "Проведені уроки зберігають ставку, за якою вони були проведені"
        }
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
      />
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" component="h3">
          Щотижневі уроки
        </Typography>
        {slots.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Уроків на тиждень ще немає. Додайте перший день.
          </Typography>
        )}
        {slots.map((slot, index) => (
          <Stack
            key={slot.key}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { sm: "flex-start" } }}
          >
            <TextField
              select
              label="День"
              value={slot.weekday}
              onChange={(event) => updateSlot(slot.key, { weekday: event.target.value })}
              sx={{ flex: 1.4 }}
            >
              {WEEKDAY_NAMES.map((name, weekday) => (
                <MenuItem key={name} value={String(weekday + 1)}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Час (Київ)"
              type="time"
              value={slot.startTime}
              onChange={(event) => updateSlot(slot.key, { startTime: event.target.value })}
              error={Boolean(slotErrors[index].time)}
              helperText={slotErrors[index].time}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Тривалість, хв"
              value={slot.durationMinutes}
              onChange={(event) =>
                updateSlot(slot.key, { durationMinutes: event.target.value.trim() })
              }
              error={Boolean(slotErrors[index].duration)}
              helperText={slotErrors[index].duration}
              slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 3 } }}
              sx={{ flex: 1 }}
            />
            <Tooltip title="Прибрати день">
              <IconButton
                aria-label="Прибрати день"
                color="error"
                onClick={() =>
                  setSlots((current) => current.filter((item) => item.key !== slot.key))
                }
                sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={slots.length >= MAX_SLOTS_PER_STUDENT}
          onClick={addSlot}
          sx={{ alignSelf: "flex-start" }}
        >
          Додати день
        </Button>
        {slots.length >= MAX_SLOTS_PER_STUDENT && (
          <Typography variant="body2" color="error">
            {errorMessages.schedule.tooManySlots}
          </Typography>
        )}
      </Stack>
      <TextField
        label="Розклад діє з"
        type="date"
        required
        value={startsOn}
        onChange={(event) => setStartsOn(event.target.value)}
        error={Boolean(startsOnError)}
        helperText={startsOnError ?? "Уроки до цієї дати не змінюються"}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </FormDialog>
  );
}

"use client";

import { useState } from "react";
import { Button, Chip, Stack } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/DescriptionOutlined";
import { downloadFile } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { MAX_REPORT_DAYS } from "@/lib/report";
import { addDays, monthRange, shiftMonth, todayKyiv } from "@/lib/schedule";
import { FormDialog } from "@/components/FormDialog";
import { DateField } from "@/components/DateField";
import { router } from "../router";

type Props = { studentId: number; studentName: string };

const DAY_MS = 86_400_000;

// Field-level errors for the inclusive period `from`..`to`.
function periodErrors(from: string, to: string) {
  if (!from) return { from: errorMessages.report.fromRequired };
  if (!to) return { to: errorMessages.report.toRequired };
  if (from > to) return { to: errorMessages.report.rangeOrder };
  const days = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
  return days > MAX_REPORT_DAYS
    ? { to: errorMessages.report.rangeTooLong }
    : {};
}

function ReportDialog({
  studentId,
  studentName,
  onClose,
}: Props & { onClose: () => void }) {
  const today = todayKyiv();
  const month = today.slice(0, 7);
  const [from, setFrom] = useState(`${month}-01`);
  const [to, setTo] = useState(today);
  const errors = periodErrors(from, to) as { from?: string; to?: string };

  const presets = [
    { label: "Цей місяць", from: `${month}-01`, to: today },
    {
      label: "Минулий місяць",
      from: `${shiftMonth(month, -1)}-01`,
      to: addDays(monthRange(month).from, -1),
    },
  ];
  const dateField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    error?: string,
  ) => (
    <DateField
      label={label}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      sx={{ flex: 1 }}
    />
  );

  return (
    <FormDialog
      title={`Звіт: ${studentName}`}
      submitLabel="Завантажити PDF"
      submitDisabled={Boolean(errors.from || errors.to)}
      onClose={onClose}
      onSubmit={() =>
        downloadFile(
          `${router.api.studentReport(studentId)}?from=${from}&to=${to}`,
          `Звіт ${studentName} ${from} ${to}.pdf`,
          errorMessages.report.generateFailed,
        )
      }
    >
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            variant="outlined"
            onClick={() => {
              setFrom(preset.from);
              setTo(preset.to);
            }}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {dateField("Від", from, setFrom, errors.from)}
        {dateField("До", to, setTo, errors.to)}
      </Stack>
    </FormDialog>
  );
}

// Teacher-only button that downloads the student's PDF report for a chosen period.
export function ReportAction(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<DescriptionIcon />}
        onClick={() => setOpen(true)}
      >
        Звіт
      </Button>
      {open && <ReportDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

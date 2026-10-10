"use client";

import { useState } from "react";
import { Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { AppShell } from "@/components/AppShell";
import { IconAction } from "@/components/ItemRow";
import { shiftMonth, todayKyiv } from "@/lib/schedule";
import { ScheduleMonth } from "./ScheduleMonth";

const monthFormat = new Intl.DateTimeFormat("uk-UA", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const monthLabel = (month: string) => {
  const text = monthFormat.format(new Date(`${month}-01T00:00:00Z`)).replace(/\s*р\.$/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function SchedulePage() {
  const [month, setMonth] = useState(() => todayKyiv().slice(0, 7));

  return (
    <AppShell
      title="Розклад і бюджет"
      subtitle="Уроки учнів, відмітки про проведені заняття та дохід за місяць"
      actions={
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <IconAction label="Попередній місяць" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeftIcon />
          </IconAction>
          <Typography
            component="span"
            sx={{ fontWeight: 600, minWidth: 130, textAlign: "center" }}
            aria-live="polite"
          >
            {monthLabel(month)}
          </Typography>
          <IconAction label="Наступний місяць" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRightIcon />
          </IconAction>
        </Stack>
      }
    >
      <ScheduleMonth key={month} month={month} />
    </AppShell>
  );
}

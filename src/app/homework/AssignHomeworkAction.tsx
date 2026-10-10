"use client";

import { useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import AssignIcon from "@mui/icons-material/AssignmentIndOutlined";
import { api, errorText } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { IconAction } from "@/components/ItemRow";
import { router } from "../router";
import { HomeworkForm } from "./HomeworkForm";
import type { HomeworkStudentOption } from "./types";

type Notice = { severity: "success" | "warning" | "error"; text: string };

// Icon button that opens the homework form prefilled with a material's name and link.
export function AssignHomeworkAction({ title, url }: { title: string; url: string }) {
  const [students, setStudents] = useState<HomeworkStudentOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Students load on click so a list of materials does not fetch them once per row.
  const open = async () => {
    setLoading(true);
    try {
      const list = await api<HomeworkStudentOption[]>(router.api.students, {
        fallback: errorMessages.students.loadFailed,
      });
      if (list.length === 0) {
        setNotice({ severity: "warning", text: errorMessages.homework.noStudents });
      } else {
        setStudents(list);
      }
    } catch (error) {
      setNotice({ severity: "error", text: errorText(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconAction
        label={`Призначити як домашнє завдання: ${title}`}
        color="success"
        disabled={loading}
        onClick={open}
      >
        <AssignIcon />
      </IconAction>
      {students && (
        <HomeworkForm
          students={students}
          prefill={{ title, resourceUrl: url }}
          onSaved={async () =>
            setNotice({ severity: "success", text: "Домашнє завдання призначено" })
          }
          onClose={() => setStudents(null)}
        />
      )}
      <Snackbar
        open={notice !== null}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert severity={notice.severity} variant="filled" onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}

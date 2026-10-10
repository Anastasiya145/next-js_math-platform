"use client";

import { useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import FolderSharedIcon from "@mui/icons-material/FolderSharedOutlined";
import { ApiError, api, useAction } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { pickFolder, type PickerConfig } from "@/lib/google-picker";
import { IconAction } from "@/components/ItemRow";
import { router } from "../router";
import type { Student } from "./types";

type Props = { student: Student; onChanged: () => Promise<unknown> };

// Links an existing Google Drive folder to the student so submissions are uploaded there.
export function DriveFolderAction({ student, onChanged }: Props) {
  const { busy, error, run } = useAction();
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const linked = Boolean(student.hasDriveFolder);

  const choose = async () => {
    setOpen(false);
    setLinkedName(null);
    const result: { name?: string } = {};

    const ok = await run(async () => {
      const config = await api<PickerConfig>(router.api.drivePicker, {
        fallback: errorMessages.drive.pickerLoadFailed,
      });
      const folder = await pickFolder(config).catch(() => {
        throw new ApiError(errorMessages.drive.pickerLoadFailed);
      });
      if (!folder) return;
      await api(router.api.studentDriveFolder(student.id), {
        method: "PUT",
        body: { folderId: folder.id },
        fallback: errorMessages.drive.folderSaveFailed,
      });
      result.name = folder.name;
    });

    if (result.name) {
      setLinkedName(result.name);
      await onChanged();
    }
    setOpen(!ok || Boolean(result.name));
  };

  return (
    <>
      <IconAction
        label={linked ? "Змінити папку Google Drive" : "Обрати папку Google Drive"}
        color={linked ? "success" : "inherit"}
        loading={busy}
        onClick={choose}
      >
        {linked ? <FolderSharedIcon /> : <FolderIcon />}
      </IconAction>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={(_event, reason) => reason !== "clickaway" && setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={error ? "error" : "success"}
          variant="filled"
          onClose={() => setOpen(false)}
        >
          {error ?? `Папку «${linkedName}» підключено до ${student.name}`}
        </Alert>
      </Snackbar>
    </>
  );
}

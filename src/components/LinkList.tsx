"use client";

import type { ReactNode } from "react";
import { List } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { IconAction, ItemRow } from "./ItemRow";
import type { Tone } from "./tones";

export type LinkItem = {
  id: string | number;
  name: string;
  url: string;
  secondary?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
};

// List of external links with an "open" action and an optional "delete" action.
export function LinkList({
  items,
  onDelete,
  busy,
}: {
  items: LinkItem[];
  onDelete?: (id: LinkItem["id"]) => void;
  busy?: boolean;
}) {
  return (
    <List disablePadding>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          icon={item.icon ?? <LinkIcon />}
          tone={item.tone}
          primary={item.name}
          secondary={item.secondary}
          actions={
            <>
              <IconAction
                label={`Відкрити: ${item.name}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon />
              </IconAction>
              {onDelete && (
                <IconAction
                  label={`Видалити: ${item.name}`}
                  color="error"
                  disabled={busy}
                  onClick={() => onDelete(item.id)}
                >
                  <DeleteIcon />
                </IconAction>
              )}
            </>
          }
        />
      ))}
    </List>
  );
}

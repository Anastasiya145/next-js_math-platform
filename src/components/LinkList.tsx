"use client";

import { useState, type ReactNode } from "react";
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
  // Rendered right after "open", e.g. an assign-as-homework button.
  extra?: ReactNode;
  // Rendered between "open" and "delete", e.g. an EditAction.
  edit?: ReactNode;
};

// List of external links with an "open" action and an optional "delete" action.
export function LinkList({
  items,
  onDelete,
  busy,
}: {
  items: LinkItem[];
  onDelete?: (id: LinkItem["id"]) => unknown;
  busy?: boolean;
}) {
  const [pendingId, setPendingId] = useState<LinkItem["id"] | null>(null);

  const remove = async (id: LinkItem["id"]) => {
    setPendingId(id);
    try {
      await onDelete?.(id);
    } finally {
      setPendingId(null);
    }
  };

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
              {item.extra}
              {item.edit}
              {onDelete && (
                <IconAction
                  label={`Видалити: ${item.name}`}
                  color="error"
                  loading={pendingId === item.id}
                  disabled={busy}
                  onClick={() => void remove(item.id)}
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

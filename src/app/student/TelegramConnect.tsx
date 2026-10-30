"use client";

import { useEffect, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import TelegramIcon from "@mui/icons-material/Telegram";
import { api, useAction, useApi } from "@/lib/api";
import { errorMessages } from "@/lib/error-messages";
import { useAppLanguage } from "@/lib/LanguageProvider";
import { PageSection } from "@/components/PageSection";
import { router } from "../router";

type TelegramStatus = { configured: boolean; linked: boolean };

export function TelegramConnect() {
  const { locale, t } = useAppLanguage();
  const { data, error, reload } = useApi<TelegramStatus>(
    router.api.studentTelegram,
    errorMessages.telegram.statusFailed,
    locale,
  );
  const action = useAction(locale);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  // The student confirms in Telegram, so refresh the status on return to this tab.
  useEffect(() => {
    if (!linkUrl) return;
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [linkUrl, reload]);

  if (!data?.configured && !error) return null;

  const connect = () =>
    action.run(async () => {
      const { url } = await api<{ url: string }>(router.api.studentTelegram, {
        method: "POST",
        fallback: errorMessages.telegram.linkFailed,
        locale,
      });
      setLinkUrl(url);
    });

  const disconnect = () =>
    action.run(async () => {
      await api(router.api.studentTelegram, {
        method: "DELETE",
        fallback: errorMessages.telegram.unlinkFailed,
        locale,
      });
      setLinkUrl(null);
      await reload();
    });

  return (
    <PageSection
      title={t("telegramTitle")}
      subtitle={t("telegramDescription")}
      icon={<TelegramIcon />}
      tone="info"
      error={error ?? action.error}
    >
      {data?.linked ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Chip
            icon={<CheckCircleIcon />}
            color="success"
            label={t("telegramLinkedStatus")}
          />
          <Button onClick={() => void disconnect()} loading={action.busy}>
            {t("telegramDisconnect")}
          </Button>
        </Stack>
      ) : linkUrl ? (
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            {t("telegramOpenHint")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="contained"
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<TelegramIcon />}
            >
              {t("telegramOpenBot")}
            </Button>
            <Button onClick={() => void reload()}>{t("telegramCheck")}</Button>
          </Stack>
        </Stack>
      ) : (
        data?.configured && (
          <Button
            variant="contained"
            startIcon={<TelegramIcon />}
            loading={action.busy}
            onClick={() => void connect()}
          >
            {t("telegramConnect")}
          </Button>
        )
      )}
    </PageSection>
  );
}

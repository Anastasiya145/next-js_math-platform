import { useCallback, useEffect, useState } from "react";
import { errorMessages } from "@/lib/error-messages";
import type { AppLocale } from "@/lib/languages";
import { translateError } from "@/lib/language-messages";

export class ApiError extends Error {}

export const errorText = (error: unknown, locale: AppLocale = "uk") =>
  translateError(
    error instanceof ApiError
      ? error.message
      : errorMessages.common.actionFailed,
    locale,
  );

type Options = {
  method?: string;
  body?: unknown;
  fallback?: string;
  locale?: AppLocale;
};

// Returns `data` from the `{ data, error }` envelope; throws ApiError with a catalog message.
export async function api<T = undefined>(
  url: string,
  {
    method,
    body,
    fallback = errorMessages.common.actionFailed,
    locale = "uk",
  }: Options = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(url, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers:
        body === undefined || isForm
          ? undefined
          : { "Content-Type": "application/json" },
      body:
        body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      translateError(errorMessages.common.networkFailed, locale),
    );
  }
  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };
  if (!res.ok)
    throw new ApiError(translateError(json.error ?? fallback, locale));
  return json.data as T;
}

// Saves a binary response (e.g. a PDF) as `filename`; a JSON error body becomes an ApiError.
export async function downloadFile(
  url: string,
  filename: string,
  fallback: string = errorMessages.common.actionFailed,
  locale: AppLocale = "uk",
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError(
      translateError(errorMessages.common.networkFailed, locale),
    );
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(translateError(json.error ?? fallback, locale));
  }
  const objectUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function useApi<T>(
  url: string | null,
  fallback?: string,
  locale: AppLocale = "uk",
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({
    data: null,
    error: null,
    loading: Boolean(url),
  });

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const data = await api<T>(url, { fallback, locale });
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorText(error, locale),
        loading: false,
      }));
    }
  }, [url, fallback, locale]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}

// Tracks busy/error state for one-off mutations; `run` resolves to true on success.
export function useAction(locale: AppLocale = "uk") {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (err) {
      setError(errorText(err, locale));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run, reset: () => setError(null) };
}

import { useCallback, useEffect, useState } from "react";
import { errorMessages } from "@/lib/error-messages";

export class ApiError extends Error {}

export const errorText = (error: unknown) =>
  error instanceof ApiError ? error.message : errorMessages.common.actionFailed;

type Options = { method?: string; body?: unknown; fallback?: string };

// Returns `data` from the `{ data, error }` envelope; throws ApiError with a catalog message.
export async function api<T = undefined>(
  url: string,
  { method, body, fallback = errorMessages.common.actionFailed }: Options = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(url, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(errorMessages.common.networkFailed);
  }
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!res.ok) throw new ApiError(json.error ?? fallback);
  return json.data as T;
}

// Saves a binary response (e.g. a PDF) as `filename`; a JSON error body becomes an ApiError.
export async function downloadFile(
  url: string,
  filename: string,
  fallback: string = errorMessages.common.actionFailed,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ApiError(errorMessages.common.networkFailed);
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(json.error ?? fallback);
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

export function useApi<T>(url: string | null, fallback?: string) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: Boolean(url),
  });

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const data = await api<T>(url, { fallback });
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((current) => ({ ...current, error: errorText(error), loading: false }));
    }
  }, [url, fallback]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}

// Tracks busy/error state for one-off mutations; `run` resolves to true on success.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run, reset: () => setError(null) };
}

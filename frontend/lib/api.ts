export type ApiErrorDetail = {
  field?: string;
  message?: string;
  [key: string]: unknown;
};

export type ApiEnvelope<TData> = {
  success: boolean;
  message: string;
  data: TData;
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[] | null;
  };
  timestamp?: string;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | null | undefined>;
  token?: string | null;
  cache?: RequestCache;
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details: ApiErrorDetail[] | null;

  constructor({
    status,
    code,
    message,
    details,
  }: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[] | null;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

export function buildQuery(
  query?: ApiRequestOptions["query"],
): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function buildApiUrl(
  path: string,
  query?: ApiRequestOptions["query"],
): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `${path}${buildQuery(query)}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}${buildQuery(query)}`;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("vending-ai-session");
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as { token?: string };
    return session.token ?? null;
  } catch {
    return null;
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<TData = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiEnvelope<TData>> {
  const token = options.token === undefined ? getStoredToken() : options.token;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? "no-store",
  });

  const parsed = await parseResponse(response);
  const envelope = parsed as Partial<ApiEnvelope<TData>>;

  if (!response.ok || envelope.success === false) {
    throw new ApiClientError({
      status: response.status,
      code: envelope.error?.code || "API_ERROR",
      message:
        envelope.message ||
        envelope.error?.message ||
        `Request failed with status ${response.status}`,
      details: envelope.error?.details ?? null,
    });
  }

  return envelope as ApiEnvelope<TData>;
}

export async function apiUpload<TData = unknown>(
  path: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<ApiEnvelope<TData>> {
  const token = options.token === undefined ? getStoredToken() : options.token;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path, options.query), {
    method: "POST",
    headers,
    body: formData,
    cache: options.cache ?? "no-store",
  });

  const parsed = await parseResponse(response);
  const envelope = parsed as Partial<ApiEnvelope<TData>>;

  if (!response.ok || envelope.success === false) {
    throw new ApiClientError({
      status: response.status,
      code: envelope.error?.code || "UPLOAD_ERROR",
      message: envelope.message || "Upload failed",
      details: envelope.error?.details ?? null,
    });
  }

  return envelope as ApiEnvelope<TData>;
}

export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const token = options.token === undefined ? getStoredToken() : options.token;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    const parsed = await parseResponse(response);
    const envelope = parsed as Partial<ApiEnvelope<unknown>>;
    throw new ApiClientError({
      status: response.status,
      code: envelope.error?.code || "DOWNLOAD_ERROR",
      message: envelope.message || "Download failed",
      details: envelope.error?.details ?? null,
    });
  }

  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || "download",
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Operacao nao concluida. Tente novamente.";
}

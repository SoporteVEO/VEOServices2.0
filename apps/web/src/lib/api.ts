import axios, { isAxiosError, type AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bearer_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof window !== "undefined" &&
      isAxiosError(error) &&
      error.response?.status === 401
    ) {
      localStorage.removeItem("bearer_token");
      document.cookie = "bearer_token=; path=/; max-age=0";
      window.location.href = "/";
    }
    return Promise.reject(
      toClientError(error, "Ocurrió un error en la solicitud."),
    );
  },
);

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

const HTTP_STATUS_NAMES = new Set([
  "bad request",
  "unauthorized",
  "forbidden",
  "not found",
  "conflict",
  "unprocessable entity",
  "internal server error",
  "service unavailable",
  "gateway timeout",
]);

function getApiBodyMessage(err: AxiosError): string | null {
  const data = err.response?.data as ApiErrorBody | undefined;
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data.message)) {
    const joined = data.message.filter(Boolean).join(". ");
    return joined.length > 0 ? joined : null;
  }
  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }
  if (
    typeof data.error === "string" &&
    data.error.trim().length > 0 &&
    // NestJS sets `error: "Bad Request"` (the HTTP status name) alongside a
    // useful `message`. We only fall back to `error` for endpoints that
    // return a custom error body without a `message` field.
    !HTTP_STATUS_NAMES.has(data.error.trim().toLowerCase())
  ) {
    return data.error;
  }

  return null;
}

/**
 * Normalizes an unknown error (typically thrown by axios) into an `Error`
 * with a Spanish-friendly message.
 *
 * Notable case: when Vercel's serverless platform rejects an oversized
 * request body (FUNCTION_PAYLOAD_TOO_LARGE / 413), the response is missing
 * CORS headers. The browser blocks it, axios sees no response and reports
 * `ERR_NETWORK`, which would otherwise surface in the UI as the unhelpful
 * "Network Error". We surface a clearer hint in those cases so users know
 * to try a smaller file.
 */
export function toClientError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const apiMessage = getApiBodyMessage(err);
    if (apiMessage) return new Error(apiMessage);

    const status = err.response?.status;
    if (status === 413) {
      return new Error(
        "El archivo es demasiado grande para enviarlo. Intenta con uno más pequeño.",
      );
    }
    if (status && status >= 500) {
      return new Error(
        "Ocurrió un error en el servidor. Por favor intenta más tarde.",
      );
    }

    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return new Error("La solicitud tardó demasiado. Intenta nuevamente.");
    }
    if (err.code === "ERR_NETWORK") {
      return new Error(
        "No se pudo conectar con el servidor. Si estás subiendo un archivo, intenta con uno más pequeño o revisa tu conexión a internet.",
      );
    }
  }

  if (err instanceof Error && err.message) return err;
  return new Error(fallback);
}

export async function apiFetch<T>(
  path: string,
  init?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  },
): Promise<T> {
  const { data } = await api.request<T>({
    url: path,
    method: (init?.method as string) ?? "GET",
    data: init?.body ? JSON.parse(init.body as string) : undefined,
    headers: init?.headers as Record<string, string>,
    params: init?.query,
    paramsSerializer: (params) => {
      return new URLSearchParams(params).toString();
    },
  });

  return data;
}

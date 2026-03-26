import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

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

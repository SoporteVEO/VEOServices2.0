import axios from "axios";

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
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("bearer_token");
      document.cookie = "bearer_token=; path=/; max-age=0";
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

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

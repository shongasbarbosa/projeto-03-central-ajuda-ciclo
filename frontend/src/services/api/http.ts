const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const ACCESS_TOKEN_KEY = "cac-access-token";
const REFRESH_TOKEN_KEY = "cac-refresh-token";

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(access: string | null, refresh?: string | null): void {
  try {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (refresh !== undefined) {
      if (refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  } catch {
    // ignora falha ao persistir token
  }
}

export function setAccessToken(token: string | null): void {
  setTokens(token);
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { access: string };
  setTokens(data.access);
  return data.access;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`Erro na requisição (${status})`);
  }
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  const doFetch = (token: string | null) =>
    fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch(getAccessToken());

  if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh") {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

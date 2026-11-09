const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const TOKEN_KEY = 'sweety.token';

/** An error returned by the API, with the user-facing message and per-field messages. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// localStorage can throw (private mode, blocked storage) – never let that crash the app.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

let handleUnauthorized: (() => void) | null = null;

/** Called when a logged-in request gets 401 (expired/invalid token). */
export function onUnauthorized(handler: (() => void) | null): void {
  handleUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string; fields?: Record<string, string> } })
    | null;

  if (!response.ok) {
    if (response.status === 401 && token) handleUnauthorized?.();
    throw new ApiError(
      response.status,
      data?.error?.message ?? 'Something went wrong. Please try again.',
      data?.error?.fields ?? {},
    );
  }

  return data as T;
}

/** Builds "?a=1&b=2", skipping empty values. */
export function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

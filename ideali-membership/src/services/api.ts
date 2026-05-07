import { AUTH_STORAGE_KEY } from "../auth/authStorage";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
const inFlightGetRequests = new Map<string, Promise<unknown>>();

export function createApiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}

function readStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const candidate = JSON.parse(raw) as Record<string, unknown>;
    const token = candidate.AccessToken ?? candidate.accessToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

function buildHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const accessToken = readStoredAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

export async function postForm<T>(path: string, fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  const response = await fetch(createApiUrl(path), {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  });

  return readJsonResponse<T>(response);
}

export async function postFormData<T>(path: string, formData: FormData) {
  const response = await fetch(createApiUrl(path), {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  });

  return readJsonResponse<T>(response);
}

export async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(createApiUrl(path), {
    method: "POST",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });

  return readJsonResponse<T>(response);
}

export async function putJson<T>(path: string, body: unknown) {
  const response = await fetch(createApiUrl(path), {
    method: "PUT",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });

  return readJsonResponse<T>(response);
}

export async function getJson<T>(path: string) {
  const requestKey = createApiUrl(path);
  const existingRequest = inFlightGetRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const request = fetch(requestKey, {
    method: "GET",
    headers: buildHeaders(),
  })
    .then((response) => readJsonResponse<T>(response))
    .finally(() => {
      inFlightGetRequests.delete(requestKey);
    });

  inFlightGetRequests.set(requestKey, request as Promise<unknown>);
  return request;
}

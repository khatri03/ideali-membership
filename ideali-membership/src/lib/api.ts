const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

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

export async function postForm<T>(path: string, fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  const response = await fetch(createApiUrl(path), {
    method: "POST",
    body: formData,
  });

  return readJsonResponse<T>(response);
}

export async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(createApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<T>(response);
}

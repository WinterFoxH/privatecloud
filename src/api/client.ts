const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wspólny wrapper fetch — dokleja bazowy URL, parsuje JSON, rzuca ApiError przy !ok.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && String((body as { error: unknown }).error)) ||
      response.statusText ||
      'Błąd API';
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export { API_BASE };

import { getAccessToken, clearAccessToken } from './tokenStorage';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};
/**
 * Wspólny wrapper fetch — dokleja bazowy URL, parsuje JSON, rzuca ApiError przy !ok.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options; 
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = { ...(fetchOptions.headers as Record<string, string>) };
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => undefined) : undefined;

  if (response.status === 401 && !skipAuthRedirect) {
    clearAccessToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  
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

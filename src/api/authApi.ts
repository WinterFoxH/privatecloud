import { apiFetch } from './client';
import { setAccessToken, clearAccessToken } from './tokenStorage';
import type { User } from '../types';

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface MeResponse {
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuthRedirect: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function fetchMe(): Promise<User> {
  const data = await apiFetch<MeResponse>('/api/auth/me', {
    skipAuthRedirect: true,
  });
  return data.user;
}

export function logoutLocal(): void {
  clearAccessToken();
}

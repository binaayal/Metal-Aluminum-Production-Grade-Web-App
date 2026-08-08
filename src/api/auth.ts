import { apiGet, apiPost } from './client';
import type { User } from '../types/domain';

interface AuthResponse {
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const data = await apiPost<AuthResponse>('/api/auth/login', { email, password });
  return data.user;
}

export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout');
}

export async function getCurrentUser(): Promise<User> {
  const data = await apiGet<AuthResponse>('/api/auth/me');
  return data.user;
}

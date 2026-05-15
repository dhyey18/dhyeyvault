'use client';

import { api } from './apiClient';

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: SessionUser } | { error: string }> {
  try {
    const data = await api<{ user: { id: string; email: string; name: string } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) }
    );
    return {
      user: { userId: data.user.id, email: data.user.email, name: data.user.name },
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Registration failed' };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: SessionUser } | { error: string }> {
  try {
    const data = await api<{ user: { id: string; email: string; name: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    return {
      user: { userId: data.user.id, email: data.user.email, name: data.user.name },
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Login failed' };
  }
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    return await api<SessionUser>('/api/auth/me');
  } catch {
    return null;
  }
}

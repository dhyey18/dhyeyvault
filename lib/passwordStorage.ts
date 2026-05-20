'use client';

import { api } from './apiClient';
import type { PasswordEntry } from './types';
import { encryptText, decryptText } from './crypto';

interface EncryptedRow {
  id: string;
  userId: string;
  data: string;
  iv: string;
}

interface PasswordMeta {
  userId: string;
  salt: string;
  verifier: string;
  verifierIv: string;
}

export async function getPasswordMeta(userId: string): Promise<PasswordMeta | null> {
  try {
    return await api<PasswordMeta | null>('/api/password-meta');
  } catch {
    return null;
  }
}

export async function setPasswordMeta(meta: PasswordMeta): Promise<void> {
  await api('/api/password-meta', {
    method: 'POST',
    body: JSON.stringify({
      salt: meta.salt,
      verifier: meta.verifier,
      verifierIv: meta.verifierIv,
    }),
  });
}

export async function savePasswordEntry(
  entry: PasswordEntry,
  key: CryptoKey
): Promise<void> {
  const payload = JSON.stringify({
    siteName: entry.siteName,
    siteUrl: entry.siteUrl,
    username: entry.username,
    password: entry.encryptedPassword,
    passwordIv: entry.iv,  // inner IV — required to decrypt the password field
    category: entry.category,
    notes: entry.notes,
    favorite: entry.favorite,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lastUsed: entry.lastUsed,
    strength: entry.strength,
  });

  const { ciphertext, iv } = await encryptText(payload, key);

  await api('/api/passwords', {
    method: 'POST',
    body: JSON.stringify({ id: entry.id, data: ciphertext, iv }),
  });
}

export async function loadPasswordEntries(
  userId: string,
  key: CryptoKey
): Promise<PasswordEntry[]> {
  const rows = await api<EncryptedRow[]>('/api/passwords');
  const entries: PasswordEntry[] = [];

  for (const row of rows) {
    try {
      const plain = await decryptText(row.data, row.iv, key);
      const fields = JSON.parse(plain);
      entries.push({
        id: row.id,
        userId: row.userId,
        encryptedPassword: fields.password,
        ...fields,
        iv: fields.passwordIv ?? row.iv,  // prefer stored inner IV; fall back for legacy rows
      });
    } catch {
      // wrong key or corrupt — skip
    }
  }

  return entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function deletePasswordEntry(id: string): Promise<void> {
  await api(`/api/passwords/${id}`, { method: 'DELETE' });
}

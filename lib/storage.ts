'use client';

import { api } from './apiClient';
import type { VaultDocument } from './types';

export async function saveDocument(doc: VaultDocument): Promise<void> {
  await api('/api/documents', {
    method: 'POST',
    body: JSON.stringify(doc),
  });
}

export async function getDocument(id: string): Promise<VaultDocument | null> {
  try {
    return await api<VaultDocument>(`/api/documents/${id}`);
  } catch {
    return null;
  }
}

export async function getUserDocuments(userId: string): Promise<VaultDocument[]> {
  try {
    return await api<VaultDocument[]>('/api/documents');
  } catch {
    return [];
  }
}

export async function deleteDocument(id: string): Promise<void> {
  await api(`/api/documents/${id}`, { method: 'DELETE' });
}

export interface StoredFile {
  id: string;
  data: string;
  mimeType: string;
}

export async function saveFile(file: StoredFile): Promise<void> {
  await api('/api/files', {
    method: 'POST',
    body: JSON.stringify(file),
  });
}

export async function getFile(id: string): Promise<StoredFile | null> {
  try {
    return await api<StoredFile>(`/api/files/${id}`);
  } catch {
    return null;
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

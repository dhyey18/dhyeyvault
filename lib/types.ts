export type DocumentCategory =
  | 'identity'
  | 'financial'
  | 'medical'
  | 'legal'
  | 'personal'
  | 'other';

export interface VaultDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes: string;
  aiSummary?: string;
  extractedText?: string;
  favorite: boolean;
  userId: string;
}

export interface StoredFile {
  id: string;
  data: string; // base64
  mimeType: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documentIds?: string[];
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identity: 'Identity',
  financial: 'Financial',
  medical: 'Medical',
  legal: 'Legal',
  personal: 'Personal',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  identity: '#3b82f6',
  financial: '#10b981',
  medical: '#ef4444',
  legal: '#f59e0b',
  personal: '#a855f7',
  other: '#6b7280',
};

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  identity: 'id-card',
  financial: 'banknote',
  medical: 'heart-pulse',
  legal: 'scale',
  personal: 'user',
  other: 'folder',
};

export type PasswordCategory =
  | 'social'
  | 'finance'
  | 'work'
  | 'shopping'
  | 'email'
  | 'other';

export const PASSWORD_CATEGORY_LABELS: Record<PasswordCategory, string> = {
  social: 'Social',
  finance: 'Finance',
  work: 'Work',
  shopping: 'Shopping',
  email: 'Email',
  other: 'Other',
};

export const PASSWORD_CATEGORY_COLORS: Record<PasswordCategory, string> = {
  social: '#3b82f6',
  finance: '#10b981',
  work: '#7c3aed',
  shopping: '#f59e0b',
  email: '#ef4444',
  other: '#6b7280',
};

export interface PasswordEntry {
  id: string;
  userId: string;
  siteName: string;
  siteUrl: string;
  username: string;
  encryptedPassword: string; // AES-GCM ciphertext (base64)
  iv: string;                // AES-GCM IV (base64)
  category: PasswordCategory;
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  strength?: number; // 0-4
}

export interface StoredEncryptedEntry {
  id: string;
  userId: string;
  encryptedData: string; // full JSON of PasswordEntry fields (except id/userId) encrypted
  iv: string;
}

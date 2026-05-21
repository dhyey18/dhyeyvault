'use client';

const PBKDF2_ITERATIONS = 200_000;
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

function b64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function bufferToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64ToBuffer(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,  // extractable so we can persist the session
    KEY_USAGE
  );
}

// ── 24-hour key persistence (localStorage) ───────────────────────────────────

const SESSION_STORAGE_KEY = 'dhyeyvault_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface PersistedSession { keyB64: string; expiresAt: number; }

export async function persistSession(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey('raw', key);
  const session: PersistedSession = {
    keyB64: bufferToB64(raw),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function restoreSession(): Promise<CryptoKey | null> {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: PersistedSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return crypto.subtle.importKey(
      'raw', b64ToBuffer(session.keyB64),
      { name: 'AES-GCM' }, true, KEY_USAGE
    );
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );
  return {
    ciphertext: bufferToB64(cipherBuf),
    iv: bufferToB64(iv.buffer),
  };
}

export async function decryptText(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuffer(iv) },
    key,
    b64ToBuffer(ciphertext)
  );
  return dec.decode(plainBuf);
}

export function generateSalt(): string {
  return bufferToB64(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

export function generatePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}): string {
  const sets = [
    opts.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    opts.lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
    opts.digits ? '0123456789' : '',
    opts.symbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
  ].filter(Boolean);

  if (!sets.length) return '';
  const charset = sets.join('');
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);

  let pw = sets.map((s) => s[arr[0] % s.length]).join('');
  for (let i = pw.length; i < opts.length; i++) {
    pw += charset[arr[i] % charset.length];
  }
  return pw
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PasswordEntry } from '@/lib/types';
import {
  getPasswordMeta,
  setPasswordMeta,
  savePasswordEntry,
  loadPasswordEntries,
  deletePasswordEntry,
} from '@/lib/passwordStorage';
import { deriveKey, encryptText, decryptText, generateSalt, persistSession, restoreSession, clearSession } from '@/lib/crypto';
import { useAuth } from './AuthContext';

interface PasswordContextValue {
  locked: boolean;
  entries: PasswordEntry[];
  loading: boolean;
  setupDone: boolean;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  setupVault: (masterPassword: string) => Promise<void>;
  addEntry: (data: Omit<PasswordEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'encryptedPassword' | 'iv'> & { plainPassword: string }) => Promise<void>;
  updateEntry: (id: string, data: Partial<PasswordEntry> & { plainPassword?: string }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getPlainPassword: (entry: PasswordEntry) => Promise<string>;
  checkSetup: () => Promise<boolean>;
}

const PasswordContext = createContext<PasswordContextValue>({
  locked: true,
  entries: [],
  loading: false,
  setupDone: false,
  unlock: async () => false,
  lock: () => {},
  setupVault: async () => {},
  addEntry: async () => {},
  updateEntry: async () => {},
  removeEntry: async () => {},
  getPlainPassword: async () => '',
  checkSetup: async () => false,
});

const VERIFIER_PLAINTEXT = 'dhyeyvault-verified';

export function PasswordProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [locked, setLocked] = useState(true);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const checkSetup = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    const meta = await getPasswordMeta(session.userId);
    const done = !!meta;
    setSetupDone(done);

    // Auto-restore 24-hour session if vault is still locked
    if (done && meta && cryptoKey === null) {
      const key = await restoreSession();
      if (key) {
        const verified = await decryptText(meta.verifier, meta.verifierIv, key).catch(() => null);
        if (verified === VERIFIER_PLAINTEXT) {
          setLoading(true);
          try {
            const loaded = await loadPasswordEntries(session.userId, key);
            setCryptoKey(key);
            setEntries(loaded);
            setLocked(false);
          } finally {
            setLoading(false);
          }
        } else {
          clearSession(); // key is stale / wrong user
        }
      }
    }

    return done;
  }, [session, cryptoKey]);

  const setupVault = useCallback(
    async (masterPassword: string) => {
      if (!session) return;
      const salt = generateSalt();
      const key = await deriveKey(masterPassword, salt);
      const { ciphertext: verifier, iv: verifierIv } = await encryptText(
        VERIFIER_PLAINTEXT,
        key
      );
      await setPasswordMeta({ userId: session.userId, salt, verifier, verifierIv });
      await persistSession(key);
      setCryptoKey(key);
      setSetupDone(true);
      setLocked(false);
      setEntries([]);
    },
    [session]
  );

  const unlock = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      if (!session) return false;
      const meta = await getPasswordMeta(session.userId);
      if (!meta) return false;
      setLoading(true);
      try {
        const key = await deriveKey(masterPassword, meta.salt);
        const verified = await decryptText(meta.verifier, meta.verifierIv, key).catch(
          () => null
        );
        if (verified !== VERIFIER_PLAINTEXT) return false;
        const loaded = await loadPasswordEntries(session.userId, key);
        await persistSession(key);
        setCryptoKey(key);
        setEntries(loaded);
        setLocked(false);
        return true;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const lock = useCallback(() => {
    clearSession();
    setCryptoKey(null);
    setEntries([]);
    setLocked(true);
  }, []);

  const addEntry = useCallback(
    async (
      data: Omit<PasswordEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'encryptedPassword' | 'iv'> & {
        plainPassword: string;
      }
    ) => {
      if (!session || !cryptoKey) return;
      const { plainPassword, ...rest } = data;
      const { ciphertext, iv } = await encryptText(plainPassword, cryptoKey);
      const entry: PasswordEntry = {
        ...rest,
        id: uuidv4(),
        userId: session.userId,
        encryptedPassword: ciphertext,
        iv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await savePasswordEntry(entry, cryptoKey);
      setEntries((prev) => [entry, ...prev]);
    },
    [session, cryptoKey]
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<PasswordEntry> & { plainPassword?: string }) => {
      if (!session || !cryptoKey) return;
      const existing = entries.find((e) => e.id === id);
      if (!existing) return;
      const { plainPassword, ...rest } = data;
      let encryptedPassword = existing.encryptedPassword;
      let iv = existing.iv;
      if (plainPassword !== undefined) {
        const enc = await encryptText(plainPassword, cryptoKey);
        encryptedPassword = enc.ciphertext;
        iv = enc.iv;
      }
      const updated: PasswordEntry = {
        ...existing,
        ...rest,
        encryptedPassword,
        iv,
        updatedAt: new Date().toISOString(),
      };
      await savePasswordEntry(updated, cryptoKey);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    },
    [session, cryptoKey, entries]
  );

  const removeEntry = useCallback(async (id: string) => {
    await deletePasswordEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getPlainPassword = useCallback(
    async (entry: PasswordEntry): Promise<string> => {
      if (!cryptoKey) return '';
      return decryptText(entry.encryptedPassword, entry.iv, cryptoKey);
    },
    [cryptoKey]
  );

  return (
    <PasswordContext.Provider
      value={{
        locked,
        entries,
        loading,
        setupDone,
        unlock,
        lock,
        setupVault,
        addEntry,
        updateEntry,
        removeEntry,
        getPlainPassword,
        checkSetup,
      }}
    >
      {children}
    </PasswordContext.Provider>
  );
}

export function usePasswords() {
  return useContext(PasswordContext);
}

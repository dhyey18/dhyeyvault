'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { VaultDocument } from '@/lib/types';
import { getUserDocuments, saveDocument, deleteDocument } from '@/lib/storage';
import { useAuth } from './AuthContext';

interface VaultContextValue {
  documents: VaultDocument[];
  loading: boolean;
  addDocument: (doc: VaultDocument) => Promise<void>;
  updateDocument: (doc: VaultDocument) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const VaultContext = createContext<VaultContextValue>({
  documents: [],
  loading: true,
  addDocument: async () => {},
  updateDocument: async () => {},
  removeDocument: async () => {},
  refresh: async () => {},
});

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const docs = await getUserDocuments(session.userId); // userId ignored by API (uses JWT)
    docs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setDocuments(docs);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addDocument = async (doc: VaultDocument) => {
    await saveDocument(doc);
    setDocuments((prev) => [doc, ...prev]);
  };

  const updateDocument = async (doc: VaultDocument) => {
    await saveDocument(doc);
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  };

  const removeDocument = async (id: string) => {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <VaultContext.Provider
      value={{ documents, loading, addDocument, updateDocument, removeDocument, refresh }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  return useContext(VaultContext);
}

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentCategory, VaultDocument } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import { fileToBase64, saveFile } from '@/lib/storage';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';

interface UploadModalProps {
  onClose: () => void;
}

type Stage = 'drop' | 'ai-analyzing' | 'review' | 'saving' | 'done' | 'error';

interface DocDraft {
  file: File;
  base64: string;
  suggestedName: string;
  category: DocumentCategory;
  summary: string;
  tags: string[];
  notes: string;
}

export function UploadModal({ onClose }: UploadModalProps) {
  const { addDocument } = useVault();
  const { session } = useAuth();
  const [stage, setStage] = useState<Stage>('drop');
  const [draft, setDraft] = useState<DocDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      setStage('ai-analyzing');

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
        });

        if (!res.ok) throw new Error('AI analysis failed');
        const data = await res.json();

        setDraft({
          file,
          base64,
          suggestedName: data.suggestedName || file.name,
          category: data.category || 'other',
          summary: data.summary || '',
          tags: data.tags || [],
          notes: '',
        });
        setStage('review');
      } catch {
        setDraft({
          file,
          base64: await fileToBase64(file),
          suggestedName: file.name,
          category: 'other',
          summary: '',
          tags: [],
          notes: '',
        });
        setStage('review');
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'text/*': [],
    },
  });

  const handleSave = async () => {
    if (!draft || !session) return;
    setStage('saving');
    try {
      const id = uuidv4();
      await saveFile({ id, data: draft.base64, mimeType: draft.file.type });
      const doc: VaultDocument = {
        id,
        name: draft.suggestedName,
        category: draft.category,
        fileType: draft.file.type,
        fileSize: draft.file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: draft.tags,
        notes: draft.notes,
        aiSummary: draft.summary,
        favorite: false,
        userId: session.userId,
      };
      await addDocument(doc);
      setStage('done');
      setTimeout(onClose, 1200);
    } catch {
      setErrorMsg('Failed to save document. Please try again.');
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg shadow-2xl glow-purple animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-vault-border">
          <h2 className="font-semibold text-vault-text flex items-center gap-2">
            <Sparkles size={18} className="text-vault-purple-light" />
            Smart Upload
          </h2>
          <button onClick={onClose} className="text-vault-muted hover:text-vault-text p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {stage === 'drop' && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${isDragActive
                  ? 'border-vault-purple bg-vault-purple/10'
                  : 'border-vault-border hover:border-vault-purple/50 hover:bg-vault-card/50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload size={40} className="mx-auto mb-3 text-vault-muted" />
              <p className="text-vault-text font-medium mb-1">
                {isDragActive ? 'Drop it here!' : 'Drop a file or click to browse'}
              </p>
              <p className="text-xs text-vault-muted">
                Images, PDFs, text files — AI will analyze automatically
              </p>
            </div>
          )}

          {stage === 'ai-analyzing' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 size={40} className="text-vault-purple animate-spin" />
                <Sparkles
                  size={18}
                  className="absolute -top-1 -right-1 text-vault-gold"
                />
              </div>
              <p className="text-vault-text font-medium">AI analyzing document…</p>
              <p className="text-xs text-vault-muted text-center">
                Gemini is extracting info and suggesting a category
              </p>
            </div>
          )}

          {stage === 'review' && draft && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-vault-muted mb-1 block">Document name</label>
                <input
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-purple"
                  value={draft.suggestedName}
                  onChange={(e) => setDraft({ ...draft, suggestedName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-vault-muted mb-1 block">Category</label>
                <select
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-purple"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as DocumentCategory })
                  }
                >
                  {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {draft.summary && (
                <div className="bg-vault-purple/10 border border-vault-purple/30 rounded-lg p-3">
                  <p className="text-xs text-vault-purple-light font-medium mb-1">
                    AI Summary
                  </p>
                  <p className="text-xs text-vault-text">{draft.summary}</p>
                </div>
              )}

              {draft.tags.length > 0 && (
                <div>
                  <p className="text-xs text-vault-muted mb-1">AI suggested tags</p>
                  <div className="flex flex-wrap gap-1">
                    {draft.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 bg-vault-border rounded-full text-vault-muted"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-vault-muted mb-1 block">Notes (optional)</label>
                <textarea
                  rows={2}
                  className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-purple resize-none"
                  placeholder="Add any notes…"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full btn-primary rounded-lg py-2.5 text-sm font-medium"
              >
                Save to Vault
              </button>
            </div>
          )}

          {stage === 'saving' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 size={36} className="text-vault-purple animate-spin" />
              <p className="text-vault-text">Encrypting and saving…</p>
            </div>
          )}

          {stage === 'done' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <CheckCircle2 size={48} className="text-vault-green" />
              <p className="text-vault-text font-medium">Saved to vault!</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-vault-red" />
              <p className="text-vault-text text-sm">{errorMsg}</p>
              <button
                onClick={() => setStage('drop')}
                className="btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

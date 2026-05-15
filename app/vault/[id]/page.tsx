'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Trash2,
  Sparkles,
  FileText,
  Download,
  Loader2,
  Tag,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useVault } from '@/contexts/VaultContext';
import { getFile, formatFileSize } from '@/lib/storage';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';
import type { VaultDocument, DocumentCategory } from '@/lib/types';
import { CATEGORY_LABELS as CL } from '@/lib/types';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { documents, updateDocument, removeDocument } = useVault();

  const doc = documents.find((d) => d.id === id);
  const [fileData, setFileData] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtractingText] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setNotes(doc.notes);
    getFile(id).then((f) => {
      if (f) setFileData(f.data);
    });
  }, [doc, id]);

  if (!doc) {
    return (
      <AppShell title="Document">
        <div className="p-6 text-center text-vault-muted">
          Document not found.{' '}
          <Link href="/vault" className="text-vault-purple-light hover:underline">
            Back to vault
          </Link>
        </div>
      </AppShell>
    );
  }

  const color = CATEGORY_COLORS[doc.category];

  const handleAnalyze = async () => {
    if (!fileData) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: fileData,
          mimeType: doc.fileType,
          fileName: doc.name,
          fullAnalysis: true,
        }),
      });
      const data = await res.json();
      await updateDocument({
        ...doc,
        aiSummary: data.summary || doc.aiSummary,
        tags: data.tags?.length ? data.tags : doc.tags,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExtract = async () => {
    if (!fileData) return;
    setExtractingText(true);
    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: fileData, mimeType: doc.fileType }),
      });
      const data = await res.json();
      await updateDocument({
        ...doc,
        extractedText: data.text,
        updatedAt: new Date().toISOString(),
      });
      setShowText(true);
    } finally {
      setExtractingText(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    await removeDocument(doc.id);
    router.push('/vault');
  };

  const handleSaveNotes = async () => {
    await updateDocument({ ...doc, notes, updatedAt: new Date().toISOString() });
    setEditNotes(false);
  };

  const handleToggleFav = async () => {
    await updateDocument({ ...doc, favorite: !doc.favorite });
  };

  const handleDownload = () => {
    if (!fileData) return;
    const a = document.createElement('a');
    a.href = fileData;
    a.download = doc.name;
    a.click();
  };

  const handleCategoryChange = async (cat: DocumentCategory) => {
    await updateDocument({ ...doc, category: cat, updatedAt: new Date().toISOString() });
  };

  return (
    <AppShell title={doc.name}>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/vault"
            className="text-vault-muted hover:text-vault-text p-1.5 rounded-lg hover:bg-vault-card transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-vault-text truncate">{doc.name}</h2>
            <p className="text-xs text-vault-muted">
              {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              · {formatFileSize(doc.fileSize)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFav}
              className={`p-2 rounded-lg border transition-colors ${
                doc.favorite
                  ? 'border-vault-gold text-vault-gold bg-vault-gold/10'
                  : 'border-vault-border text-vault-muted hover:text-vault-gold'
              }`}
            >
              <Star size={16} className={doc.favorite ? 'fill-vault-gold' : ''} />
            </button>
            <button
              onClick={handleDownload}
              disabled={!fileData}
              className="p-2 rounded-lg border border-vault-border text-vault-muted hover:text-vault-text transition-colors disabled:opacity-40"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg border border-vault-border text-vault-muted hover:text-vault-red hover:border-vault-red/30 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-xl overflow-hidden">
            {fileData ? (
              doc.fileType.startsWith('image/') ? (
                <img
                  src={fileData}
                  alt={doc.name}
                  className="w-full h-64 object-contain bg-vault-surface"
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3 bg-vault-surface">
                  <FileText size={48} className="text-vault-muted" />
                  <p className="text-sm text-vault-muted">{doc.fileType}</p>
                  <button
                    onClick={handleDownload}
                    className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Eye size={14} /> Open File
                  </button>
                </div>
              )
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-vault-muted" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="glass rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-vault-muted mb-1">Category</p>
                <select
                  className="bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-purple w-full"
                  value={doc.category}
                  onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
                >
                  {(Object.keys(CL) as DocumentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CL[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs text-vault-muted mb-1 flex items-center gap-1">
                  <Tag size={11} /> Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.length ? (
                    doc.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 bg-vault-border/60 text-vault-muted rounded-full"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-vault-muted italic">No tags</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !fileData}
                className="flex-1 btn-primary rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {analyzing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {analyzing ? 'Analyzing…' : 'AI Analyze'}
              </button>
              <button
                onClick={handleExtract}
                disabled={extracting || !fileData}
                className="flex-1 bg-vault-card border border-vault-border rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:border-vault-purple/40 disabled:opacity-60 transition-colors text-vault-text"
              >
                {extracting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                {extracting ? 'Extracting…' : 'Extract Text'}
              </button>
            </div>
          </div>
        </div>

        {doc.aiSummary && (
          <div className="glass rounded-xl p-4 border border-vault-purple/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-vault-purple-light" />
              <p className="text-sm font-medium text-vault-purple-light">AI Summary</p>
            </div>
            <p className="text-sm text-vault-text leading-relaxed">{doc.aiSummary}</p>
          </div>
        )}

        {doc.extractedText && (
          <div className="glass rounded-xl p-4">
            <button
              onClick={() => setShowText(!showText)}
              className="flex items-center justify-between w-full text-sm font-medium text-vault-text"
            >
              <span className="flex items-center gap-2">
                <FileText size={15} />
                Extracted Text
              </span>
              {showText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showText && (
              <pre className="mt-3 text-xs text-vault-muted whitespace-pre-wrap leading-relaxed font-mono bg-vault-surface rounded-lg p-3 max-h-64 overflow-y-auto">
                {doc.extractedText}
              </pre>
            )}
          </div>
        )}

        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-vault-text flex items-center gap-2">
              <StickyNote size={15} />
              Notes
            </p>
            {!editNotes && (
              <button
                onClick={() => setEditNotes(true)}
                className="text-xs text-vault-purple-light hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editNotes ? (
            <div className="space-y-2">
              <textarea
                rows={4}
                className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-vault-purple resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="btn-primary px-4 py-1.5 rounded-lg text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNotes(doc.notes);
                    setEditNotes(false);
                  }}
                  className="px-4 py-1.5 rounded-lg text-sm text-vault-muted hover:text-vault-text border border-vault-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-vault-muted">
              {doc.notes || <span className="italic">No notes added</span>}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

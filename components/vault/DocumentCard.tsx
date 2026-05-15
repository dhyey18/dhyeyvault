'use client';

import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  File,
  Star,
  MoreVertical,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useState } from 'react';
import type { VaultDocument } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';
import { formatFileSize } from '@/lib/storage';
import { useVault } from '@/contexts/VaultContext';

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith('image/'))
    return <ImageIcon size={24} className="text-vault-blue-light" />;
  if (fileType === 'application/pdf')
    return <FileText size={24} className="text-vault-red" />;
  return <File size={24} className="text-vault-muted" />;
}

export function DocumentCard({ doc }: { doc: VaultDocument }) {
  const { updateDocument, removeDocument } = useVault();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    await updateDocument({ ...doc, favorite: !doc.favorite });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`Delete "${doc.name}"?`)) return;
    setDeleting(true);
    await removeDocument(doc.id);
  };

  const categoryColor = CATEGORY_COLORS[doc.category];

  return (
    <Link href={`/vault/${doc.id}`} className="block">
      <div
        className={`
          relative glass glass-hover rounded-xl p-4 h-full flex flex-col gap-3
          transition-all duration-200 cursor-pointer group
          ${deleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${categoryColor}20`, border: `1px solid ${categoryColor}40` }}
          >
            <FileIcon fileType={doc.fileType} />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleFavorite}
              className="p-1 rounded text-vault-muted hover:text-vault-gold transition-colors"
            >
              <Star
                size={15}
                className={doc.favorite ? 'fill-vault-gold text-vault-gold' : ''}
              />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded text-vault-muted hover:text-vault-text transition-colors"
              >
                <MoreVertical size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-10 w-36 glass rounded-lg py-1 shadow-xl border border-vault-border">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vault-muted hover:text-vault-text hover:bg-vault-card"
                  >
                    <Edit3 size={14} /> Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      handleDelete(e);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vault-red hover:bg-vault-red/10"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-vault-text truncate leading-tight">
            {doc.name}
          </p>
          {doc.aiSummary && (
            <p className="text-xs text-vault-muted mt-1 line-clamp-2 leading-relaxed">
              {doc.aiSummary}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ color: categoryColor, backgroundColor: `${categoryColor}20` }}
          >
            {CATEGORY_LABELS[doc.category]}
          </span>
          <span className="text-xs text-vault-muted">
            {formatFileSize(doc.fileSize)}
          </span>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-vault-border/60 text-vault-muted rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

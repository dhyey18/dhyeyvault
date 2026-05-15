'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Star,
  MoreVertical,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import type { PasswordEntry } from '@/lib/types';
import { PASSWORD_CATEGORY_COLORS, PASSWORD_CATEGORY_LABELS } from '@/lib/types';
import { usePasswords } from '@/contexts/PasswordContext';
import { passwordStrength } from '@/lib/crypto';

const STRENGTH_COLORS = ['#6b7280', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
}

export function PasswordCard({ entry, onEdit }: PasswordCardProps) {
  const { getPlainPassword, removeEntry, updateEntry } = usePasswords();
  const [plain, setPlain] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null);

  const color = PASSWORD_CATEGORY_COLORS[entry.category];

  const reveal = async () => {
    if (!plain) {
      const p = await getPlainPassword(entry);
      setPlain(p);
    }
    setRevealed((v) => !v);
  };

  const copy = async (type: 'user' | 'pass') => {
    let text = type === 'user' ? entry.username : (plain ?? await getPlainPassword(entry));
    if (type === 'pass' && !plain) setPlain(text);
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
    if (type === 'pass') {
      await updateEntry(entry.id, { lastUsed: new Date().toISOString() });
    }
  };

  const strength = plain ? passwordStrength(plain) : (entry.strength ?? 0);

  return (
    <div className="glass glass-hover rounded-xl p-4 flex flex-col gap-3 group">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {entry.siteName?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-vault-text truncate">{entry.siteName}</p>
            {entry.siteUrl && (
              <a
                href={entry.siteUrl.startsWith('http') ? entry.siteUrl : `https://${entry.siteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-vault-muted hover:text-vault-blue-light shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <p className="text-xs text-vault-muted truncate">{entry.username}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => updateEntry(entry.id, { favorite: !entry.favorite })}
            className="p-1 text-vault-muted hover:text-vault-gold transition-colors"
          >
            <Star size={14} className={entry.favorite ? 'fill-vault-gold text-vault-gold' : ''} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 text-vault-muted hover:text-vault-text transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 w-36 glass rounded-lg py-1 shadow-xl border border-vault-border">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(entry); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vault-muted hover:text-vault-text hover:bg-vault-card"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    if (confirm(`Delete "${entry.siteName}"?`)) await removeEntry(entry.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-vault-red hover:bg-vault-red/10"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-vault-surface rounded-lg px-3 py-2">
        <span className="flex-1 text-sm font-mono text-vault-text tracking-wider">
          {revealed && plain ? plain : '••••••••••••'}
        </span>
        <button
          onClick={reveal}
          className="text-vault-muted hover:text-vault-text transition-colors p-0.5"
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={() => copy('pass')}
          className="text-vault-muted hover:text-vault-text transition-colors p-0.5"
          title="Copy password"
        >
          {copied === 'pass' ? (
            <CheckCheck size={14} className="text-vault-green" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => copy('user')}
          className="flex items-center gap-1.5 text-xs text-vault-muted hover:text-vault-text transition-colors"
        >
          {copied === 'user' ? (
            <CheckCheck size={11} className="text-vault-green" />
          ) : (
            <Copy size={11} />
          )}
          Copy username
        </button>

        <div className="flex items-center gap-1.5">
          {strength > 0 && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((l) => (
                <div
                  key={l}
                  className="w-4 h-1 rounded-full transition-colors"
                  style={{ backgroundColor: l <= strength ? STRENGTH_COLORS[strength] : '#1e2d4d' }}
                />
              ))}
            </div>
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}20` }}
          >
            {PASSWORD_CATEGORY_LABELS[entry.category]}
          </span>
        </div>
      </div>
    </div>
  );
}

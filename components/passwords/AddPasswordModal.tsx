'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Lock,
  Sliders,
} from 'lucide-react';
import type { PasswordEntry, PasswordCategory } from '@/lib/types';
import { PASSWORD_CATEGORY_LABELS } from '@/lib/types';
import { usePasswords } from '@/contexts/PasswordContext';
import { passwordStrength, generatePassword } from '@/lib/crypto';

interface AddPasswordModalProps {
  entry?: PasswordEntry | null;
  onClose: () => void;
}

const STRENGTH_COLORS = ['#6b7280', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export function AddPasswordModal({ entry, onClose }: AddPasswordModalProps) {
  const { addEntry, updateEntry, getPlainPassword } = usePasswords();
  const isEdit = !!entry;

  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<PasswordCategory>('other');
  const [notes, setNotes] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const [genLen, setGenLen] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  useEffect(() => {
    if (!entry) return;
    setSiteName(entry.siteName);
    setSiteUrl(entry.siteUrl);
    setUsername(entry.username);
    setCategory(entry.category);
    setNotes(entry.notes);
    getPlainPassword(entry).then(setPassword);
  }, [entry]);

  const strength = passwordStrength(password);

  const handleGenerate = () => {
    const pw = generatePassword({
      length: genLen,
      upper: genUpper,
      lower: genLower,
      digits: genDigits,
      symbols: genSymbols,
    });
    setPassword(pw);
    setShowPw(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !username || !password) return;
    setSaving(true);
    try {
      if (isEdit && entry) {
        await updateEntry(entry.id, {
          siteName,
          siteUrl,
          username,
          category,
          notes,
          plainPassword: password,
          strength,
        });
      } else {
        await addEntry({
          siteName,
          siteUrl,
          username,
          category,
          notes,
          favorite: false,
          strength,
          plainPassword: password,
        });
      }
      setDone(true);
      setTimeout(onClose, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl glow-purple animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-vault-border sticky top-0 bg-vault-surface/90 backdrop-blur-sm z-10">
          <h2 className="font-semibold text-vault-text flex items-center gap-2">
            <Lock size={16} className="text-vault-purple-light" />
            {isEdit ? 'Edit Password' : 'Add Password'}
          </h2>
          <button onClick={onClose} className="text-vault-muted hover:text-vault-text p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {done && (
            <div className="flex items-center justify-center gap-2 py-2 text-vault-green">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Saved!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-vault-muted mb-1 block">Site / App name *</label>
              <input
                required
                className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple"
                placeholder="Google, Netflix…"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-vault-muted mb-1 block">URL</label>
              <input
                className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple"
                placeholder="https://google.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-vault-muted mb-1 block">Username / Email *</label>
              <input
                required
                autoComplete="off"
                className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple"
                placeholder="you@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-vault-muted">Password *</label>
                <button
                  type="button"
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="text-xs text-vault-purple-light hover:underline flex items-center gap-1"
                >
                  <Sliders size={11} />
                  Generator
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  autoComplete="new-password"
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 pr-20 text-sm text-vault-text font-mono placeholder:text-vault-muted focus:outline-none focus:border-vault-purple"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="p-1 text-vault-muted hover:text-vault-text"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="p-1 text-vault-muted hover:text-vault-purple-light"
                    title="Generate password"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              {password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex gap-0.5 flex-1">
                    {[1, 2, 3, 4].map((l) => (
                      <div
                        key={l}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          backgroundColor:
                            l <= strength ? STRENGTH_COLORS[strength] : '#1e2d4d',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: STRENGTH_COLORS[strength] }}
                  >
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            {showGenerator && (
              <div className="col-span-2 bg-vault-surface border border-vault-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-vault-text flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-vault-purple-light" />
                  Password Generator
                </p>
                <div>
                  <div className="flex justify-between text-xs text-vault-muted mb-1">
                    <span>Length</span>
                    <span className="font-mono text-vault-text">{genLen}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    value={genLen}
                    onChange={(e) => setGenLen(+e.target.value)}
                    className="w-full accent-vault-purple"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Uppercase (A-Z)', val: genUpper, set: setGenUpper },
                    { label: 'Lowercase (a-z)', val: genLower, set: setGenLower },
                    { label: 'Digits (0-9)', val: genDigits, set: setGenDigits },
                    { label: 'Symbols (!@#)', val: genSymbols, set: setGenSymbols },
                  ].map(({ label, val, set }) => (
                    <label
                      key={label}
                      className="flex items-center gap-2 text-vault-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => set(e.target.checked)}
                        className="accent-vault-purple"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full btn-primary rounded-lg py-2 text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  Generate & Use
                </button>
              </div>
            )}

            <div>
              <label className="text-xs text-vault-muted mb-1 block">Category</label>
              <select
                className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-sm text-vault-text focus:outline-none focus:border-vault-purple"
                value={category}
                onChange={(e) => setCategory(e.target.value as PasswordCategory)}
              >
                {(Object.keys(PASSWORD_CATEGORY_LABELS) as PasswordCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {PASSWORD_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-vault-muted mb-1 block">Notes</label>
            <textarea
              rows={2}
              className="w-full bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple resize-none"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving || done}
            className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {isEdit ? 'Update Password' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

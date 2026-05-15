'use client';

import { useEffect, useState } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Star,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PasswordCard } from '@/components/passwords/PasswordCard';
import { AddPasswordModal } from '@/components/passwords/AddPasswordModal';
import { usePasswords } from '@/contexts/PasswordContext';
import type { PasswordEntry, PasswordCategory } from '@/lib/types';
import { PASSWORD_CATEGORY_COLORS, PASSWORD_CATEGORY_LABELS } from '@/lib/types';

const ALL_CATS: PasswordCategory[] = ['social', 'finance', 'work', 'shopping', 'email', 'other'];

export default function PasswordsPage() {
  const { locked, loading, setupDone, entries, unlock, setupVault, lock, checkSetup } =
    usePasswords();

  const [masterPw, setMasterPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showMasterPw, setShowMasterPw] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<PasswordCategory | 'all'>('all');
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => {
    checkSetup().then(() => setSetupChecked(true));
  }, [checkSetup]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const ok = await unlock(masterPw);
    setAuthLoading(false);
    if (!ok) setAuthError('Incorrect master password');
    else setMasterPw('');
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (masterPw.length < 6) {
      setAuthError('Master password must be at least 6 characters');
      return;
    }
    if (masterPw !== confirmPw) {
      setAuthError('Passwords do not match');
      return;
    }
    setAuthLoading(true);
    await setupVault(masterPw);
    setAuthLoading(false);
    setMasterPw('');
    setConfirmPw('');
  };

  const filtered = entries
    .filter((e) => {
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      if (favOnly && !e.favorite) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.siteName.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.siteUrl.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const catCounts: Record<string, number> = { all: entries.length };
  for (const c of ALL_CATS) catCounts[c] = entries.filter((e) => e.category === c).length;

  if (!setupChecked) {
    return (
      <AppShell title="Password Vault">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-vault-purple" />
        </div>
      </AppShell>
    );
  }

  if (locked) {
    return (
      <AppShell title="Password Vault">
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl btn-primary mx-auto flex items-center justify-center mb-4 glow-purple animate-pulse-glow">
                <KeyRound size={28} />
              </div>
              <h2 className="text-xl font-bold text-vault-text mb-1">
                {setupDone ? 'Unlock Password Vault' : 'Set Up Password Vault'}
              </h2>
              <p className="text-sm text-vault-muted">
                {setupDone
                  ? 'Enter your master password to access saved passwords'
                  : 'Create a master password to encrypt all your passwords'}
              </p>
            </div>

            <div className="glass rounded-2xl p-6 glow-purple">
              <form onSubmit={setupDone ? handleUnlock : handleSetup} className="space-y-4">
                {authError && (
                  <div className="flex items-center gap-2 bg-vault-red/10 border border-vault-red/30 rounded-lg px-3 py-2.5 text-sm text-vault-red">
                    <AlertCircle size={15} />
                    {authError}
                  </div>
                )}

                {!setupDone && (
                  <div className="bg-vault-purple/10 border border-vault-purple/30 rounded-lg px-3 py-2.5 text-xs text-vault-purple-light flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Your master password is never stored — it derives the encryption key
                      locally. If you forget it, passwords cannot be recovered.
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs text-vault-muted mb-1 block">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showMasterPw ? 'text' : 'password'}
                      required
                      autoFocus
                      autoComplete="new-password"
                      value={masterPw}
                      onChange={(e) => setMasterPw(e.target.value)}
                      className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 pr-10 text-sm text-vault-text focus:outline-none focus:border-vault-purple"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPw(!showMasterPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text"
                    >
                      {showMasterPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {!setupDone && (
                  <div>
                    <label className="text-xs text-vault-muted mb-1 block">
                      Confirm Master Password
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text focus:outline-none focus:border-vault-purple"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {authLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : setupDone ? (
                    <Unlock size={15} />
                  ) : (
                    <Lock size={15} />
                  )}
                  {authLoading
                    ? setupDone
                      ? 'Unlocking…'
                      : 'Setting up…'
                    : setupDone
                    ? 'Unlock Vault'
                    : 'Create Vault'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Password Vault">
      <div className="flex h-full">
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-vault-border p-3 space-y-1">
          <button
            onClick={() => setFilterCat('all')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              filterCat === 'all'
                ? 'bg-vault-purple/20 text-vault-purple-light'
                : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
            }`}
          >
            <span>All Passwords</span>
            <span className="text-xs">{catCounts.all}</span>
          </button>

          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              favOnly
                ? 'bg-vault-gold/20 text-vault-gold'
                : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star size={13} />
              Favourites
            </span>
            <span className="text-xs">{entries.filter((e) => e.favorite).length}</span>
          </button>

          <div className="pt-2">
            <p className="text-xs text-vault-muted px-3 mb-1 font-medium uppercase tracking-wider">
              Categories
            </p>
            {ALL_CATS.map((cat) => {
              const color = PASSWORD_CATEGORY_COLORS[cat];
              const active = filterCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(active ? 'all' : cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-vault-card text-vault-text'
                      : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    {PASSWORD_CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-vault-muted">{catCounts[cat]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />
          <button
            onClick={lock}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-vault-muted hover:text-vault-red hover:bg-vault-red/10 transition-colors"
          >
            <Lock size={14} />
            Lock Vault
          </button>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-vault-border">
            <div className="flex items-center gap-2 flex-1 bg-vault-card border border-vault-border rounded-xl px-3 py-2.5 max-w-sm">
              <Search size={15} className="text-vault-muted shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-muted outline-none"
                placeholder="Search passwords…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setFavOnly(!favOnly)}
                className={`p-2 rounded-lg border transition-colors ${
                  favOnly
                    ? 'border-vault-gold text-vault-gold bg-vault-gold/10'
                    : 'border-vault-border text-vault-muted'
                }`}
              >
                <Star size={15} />
              </button>
              <select
                className="bg-vault-card border border-vault-border rounded-lg px-2 py-2 text-xs text-vault-text outline-none"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value as PasswordCategory | 'all')}
              >
                <option value="all">All</option>
                {ALL_CATS.map((c) => (
                  <option key={c} value={c}>{PASSWORD_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Password</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                {entries.length === 0 ? (
                  <>
                    <KeyRound size={48} className="text-vault-muted" />
                    <div className="text-center">
                      <p className="font-medium text-vault-text mb-1">No passwords saved</p>
                      <p className="text-sm text-vault-muted">
                        Add your first password to get started
                      </p>
                    </div>
                    <button
                      onClick={() => setAddOpen(true)}
                      className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium"
                    >
                      Add Password
                    </button>
                  </>
                ) : (
                  <>
                    <Filter size={32} className="text-vault-muted" />
                    <p className="text-vault-muted text-sm">No passwords match your filters</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-vault-muted mb-3">
                  {filtered.length} password{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((entry) => (
                    <PasswordCard
                      key={entry.id}
                      entry={entry}
                      onEdit={setEditEntry}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(addOpen || editEntry) && (
        <AddPasswordModal
          entry={editEntry}
          onClose={() => {
            setAddOpen(false);
            setEditEntry(null);
          }}
        />
      )}
    </AppShell>
  );
}

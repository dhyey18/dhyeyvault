'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Puzzle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PasswordCard } from '@/components/passwords/PasswordCard';
import { AddPasswordModal } from '@/components/passwords/AddPasswordModal';
import { HealthDashboard } from '@/components/passwords/HealthDashboard';
import { usePasswords } from '@/contexts/PasswordContext';
import type { PasswordEntry, PasswordCategory } from '@/lib/types';
import { PASSWORD_CATEGORY_COLORS, PASSWORD_CATEGORY_LABELS } from '@/lib/types';
import { api } from '@/lib/apiClient';

const ALL_CATS: PasswordCategory[] = ['social', 'finance', 'work', 'shopping', 'email', 'other'];

type ActiveView = 'passwords' | 'health' | 'extension';

const BOOKMARKLET = `javascript:(function(){var sel=['input[type="email"]','input[autocomplete="username"]','input[autocomplete="email"]','input[name*="email" i]','input[name*="user" i]','input[type="text"]'];var u=null;for(var s of sel){u=document.querySelector(s);if(u&&u.value)break;}var pw=document.querySelector('input[type="password"]');var d={s:document.title,u:location.href,n:u?u.value:'',p:pw?pw.value:''};location.href='https://dhyeyvault.vercel.app/save#'+btoa(unescape(encodeURIComponent(JSON.stringify(d))))})();`;

function BookmarkletCode() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(BOOKMARKLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border border-vault-border bg-vault-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-vault-muted font-mono truncate">{BOOKMARKLET.slice(0, 60)}…</p>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 shrink-0 rounded-lg bg-vault-purple px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function ExtensionPanel() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ token: string }>('/api/auth/extension-token');
      setToken(data.token);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-xl">
      <div>
        <h2 className="font-semibold text-vault-text mb-1">Browser Extension</h2>
        <p className="text-sm text-vault-muted">
          The DhyeyVault Chrome extension auto-detects logins and saves them directly to your vault.
        </p>
      </div>

      {/* Step 1 */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-vault-purple flex items-center justify-center text-xs font-bold text-white shrink-0">1</span>
          <p className="text-sm font-medium text-vault-text">Load the extension in Chrome</p>
        </div>
        <ol className="text-sm text-vault-muted space-y-1.5 pl-8 list-decimal">
          <li>Open Chrome and go to <code className="text-vault-purple-light">chrome://extensions</code></li>
          <li>Enable <strong className="text-vault-text">Developer mode</strong> (top-right toggle)</li>
          <li>Click <strong className="text-vault-text">Load unpacked</strong></li>
          <li>Select the <code className="text-vault-purple-light">extension/</code> folder from the project</li>
        </ol>
      </div>

      {/* Step 2 */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-vault-purple flex items-center justify-center text-xs font-bold text-white shrink-0">2</span>
          <p className="text-sm font-medium text-vault-text">Copy your API token</p>
        </div>
        <p className="text-xs text-vault-muted pl-8">
          This token lets the extension securely access your vault. Keep it private — it expires in 1 year.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 pl-8 text-vault-muted text-sm">
            <Loader2 size={14} className="animate-spin" />
            Generating token…
          </div>
        ) : token ? (
          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2 bg-vault-card border border-vault-border rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-vault-text font-mono truncate">
                {showToken ? token : `${token.slice(0, 20)}…`}
              </code>
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-vault-muted hover:text-vault-text shrink-0"
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={copy}
                className="text-vault-muted hover:text-vault-green transition-colors shrink-0"
              >
                {copied ? <Check size={13} className="text-vault-green" /> : <Copy size={13} />}
              </button>
            </div>
            <button
              onClick={fetchToken}
              className="flex items-center gap-1.5 text-xs text-vault-muted hover:text-vault-text transition-colors"
            >
              <RefreshCw size={12} />
              Regenerate token
            </button>
          </div>
        ) : (
          <button onClick={fetchToken} className="ml-8 btn-primary px-4 py-1.5 rounded-lg text-xs font-medium">
            Generate Token
          </button>
        )}
      </div>

      {/* Step 3 */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-vault-purple flex items-center justify-center text-xs font-bold text-white shrink-0">3</span>
          <p className="text-sm font-medium text-vault-text">Configure the extension</p>
        </div>
        <ol className="text-sm text-vault-muted space-y-1.5 pl-8 list-decimal">
          <li>Click the DhyeyVault extension icon in your browser toolbar</li>
          <li>Enter your <strong className="text-vault-text">Vault URL</strong> (e.g. <code className="text-vault-purple-light">https://dhyeyvault.vercel.app</code>)</li>
          <li>Paste the <strong className="text-vault-text">API Token</strong> from Step 2</li>
          <li>Click <strong className="text-vault-text">Save Settings</strong></li>
        </ol>
      </div>

      {/* Features */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs font-medium text-vault-muted uppercase tracking-wider mb-3">What the extension does</p>
        <ul className="space-y-2 text-sm text-vault-muted">
          {[
            'Detects login forms and prompts to save credentials',
            'Auto-fills saved passwords for any site',
            'Encrypts passwords with your master password before sending',
            'Works on all websites — banking, social, shopping',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check size={14} className="text-vault-green mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Safari / iPhone bookmarklet */}
      <div className="glass rounded-xl p-4 space-y-3 border border-vault-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">📱</span>
          <p className="text-sm font-medium text-vault-text">Save from Safari (iPhone / Mac)</p>
        </div>
        <p className="text-xs text-vault-muted">
          Safari doesn&apos;t support extensions the same way Chrome does. Use this <strong className="text-vault-text">bookmarklet</strong> instead — tap it after filling in your login details and it will open DhyeyVault to save them.
        </p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-vault-muted uppercase tracking-wider">How to set it up on iPhone</p>
          <ol className="text-sm text-vault-muted space-y-1.5 pl-4 list-decimal">
            <li>Copy the bookmarklet code below</li>
            <li>In Safari, bookmark any page (tap <strong className="text-vault-text">Share → Add Bookmark</strong>)</li>
            <li>Edit the bookmark — replace the URL with the copied code</li>
            <li>Next time you log in to any site, tap the bookmark from your favorites to save the password</li>
          </ol>
        </div>
        <BookmarkletCode />
      </div>
    </div>
  );
}

export default function PasswordsPage() {
  const { locked, loading, setupDone, entries, unlock, setupVault, lock, checkSetup, getPlainPassword } =
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
  const [activeView, setActiveView] = useState<ActiveView>('passwords');

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

  const filtered = entries.filter((e) => {
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
                  <label className="text-xs text-vault-muted mb-1 block">Master Password</label>
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
                    <label className="text-xs text-vault-muted mb-1 block">Confirm Master Password</label>
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
                    ? setupDone ? 'Unlocking…' : 'Setting up…'
                    : setupDone ? 'Unlock Vault' : 'Create Vault'}
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
          <SidebarBtn
            active={activeView === 'passwords' && filterCat === 'all' && !favOnly}
            onClick={() => { setActiveView('passwords'); setFilterCat('all'); setFavOnly(false); }}
            label="All Passwords"
            count={catCounts.all}
          />
          <SidebarBtn
            active={favOnly && activeView === 'passwords'}
            onClick={() => { setActiveView('passwords'); setFavOnly(!favOnly); }}
            label="Favourites"
            count={entries.filter((e) => e.favorite).length}
            icon={<Star size={13} />}
            gold
          />

          <div className="pt-2">
            <p className="text-xs text-vault-muted px-3 mb-1 font-medium uppercase tracking-wider">Categories</p>
            {ALL_CATS.map((cat) => {
              const active = filterCat === cat && activeView === 'passwords';
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveView('passwords'); setFilterCat(active ? 'all' : cat); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-vault-card text-vault-text'
                      : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PASSWORD_CATEGORY_COLORS[cat] }} />
                    {PASSWORD_CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-vault-muted">{catCounts[cat]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="space-y-1 border-t border-vault-border pt-2">
            <SidebarBtn
              active={activeView === 'health'}
              onClick={() => setActiveView('health')}
              label="Security Health"
              icon={<ShieldCheck size={14} />}
            />
            <SidebarBtn
              active={activeView === 'extension'}
              onClick={() => setActiveView('extension')}
              label="Browser Extension"
              icon={<Puzzle size={14} />}
            />
            <button
              onClick={lock}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-vault-muted hover:text-vault-red hover:bg-vault-red/10 transition-colors"
            >
              <Lock size={14} />
              Lock Vault
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Top bar — only shown on passwords view */}
          {activeView === 'passwords' && (
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

              {/* Mobile shortcuts */}
              <div className="flex items-center gap-1 lg:hidden">
                <button
                  onClick={() => setActiveView('health')}
                  className="p-2 rounded-lg border border-vault-border text-vault-muted hover:text-vault-text"
                  title="Security Health"
                >
                  <ShieldCheck size={15} />
                </button>
                <button
                  onClick={() => setActiveView('extension')}
                  className="p-2 rounded-lg border border-vault-border text-vault-muted hover:text-vault-text"
                  title="Browser Extension"
                >
                  <Puzzle size={15} />
                </button>
              </div>

              <button
                onClick={() => setAddOpen(true)}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Password</span>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeView === 'health' && (
              <HealthDashboard
                entries={entries}
                getPlainPassword={getPlainPassword}
                onEditEntry={(e) => { setEditEntry(e); setActiveView('passwords'); }}
              />
            )}

            {activeView === 'extension' && <ExtensionPanel />}

            {activeView === 'passwords' && (
              <div className="p-4 sm:p-5">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    {entries.length === 0 ? (
                      <>
                        <KeyRound size={48} className="text-vault-muted" />
                        <div className="text-center">
                          <p className="font-medium text-vault-text mb-1">No passwords saved</p>
                          <p className="text-sm text-vault-muted">Add your first password to get started</p>
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
                        <PasswordCard key={entry.id} entry={entry} onEdit={setEditEntry} />
                      ))}
                    </div>
                  </>
                )}
              </div>
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

function SidebarBtn({
  active, onClick, label, count, icon, gold,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors w-full ${
        active
          ? gold
            ? 'bg-vault-gold/20 text-vault-gold'
            : 'bg-vault-purple/20 text-vault-purple-light'
          : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {count !== undefined && <span className="text-xs">{count}</span>}
    </button>
  );
}

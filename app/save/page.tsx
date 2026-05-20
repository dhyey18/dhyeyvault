'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { usePasswords } from '@/contexts/PasswordContext';
import { useAuth } from '@/contexts/AuthContext';

interface Captured {
  s: string;  // site name
  u: string;  // site url
  n: string;  // username
  p: string;  // password
}

function calcStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export default function SavePage() {
  const router = useRouter();
  const { session } = useAuth();
  const { locked, loading, setupDone, unlock, checkSetup, addEntry } = usePasswords();

  const [captured, setCaptured] = useState<Captured | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [masterPw, setMasterPw] = useState('');
  const [showMaster, setShowMaster] = useState(false);
  const [unlockErr, setUnlockErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Read hash fragment on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const data: Captured = JSON.parse(atob(hash));
      setCaptured(data);
      setSiteName(data.s || '');
      setSiteUrl(data.u || '');
      setUsername(data.n || '');
      setPassword(data.p || '');
      // Clear hash from URL so password isn't visible
      history.replaceState(null, '', window.location.pathname);
    } catch {
      // invalid hash — just show empty form
    }
  }, []);

  useEffect(() => {
    if (session) checkSetup();
  }, [session, checkSetup]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setUnlockErr('');
    const ok = await unlock(masterPw);
    setUnlocking(false);
    if (!ok) setUnlockErr('Wrong master password');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setSaving(true);
    try {
      await addEntry({
        siteName: siteName || new URL(siteUrl).hostname,
        siteUrl,
        username,
        plainPassword: password,
        category: 'other',
        notes: '',
        favorite: false,
        strength: calcStrength(password),
      });
      setSaved(true);
      setTimeout(() => router.push('/passwords'), 1500);
    } catch {
      // ignore — stay on page
    } finally {
      setSaving(false);
    }
  }

  // Not logged in
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b18] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-violet-400" />
          <p className="text-white">Sign in to DhyeyVault first</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Saved success
  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b18] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <p className="text-lg font-semibold text-white">Saved!</p>
          <p className="mt-1 text-sm text-gray-400">Redirecting to your vault…</p>
        </div>
      </div>
    );
  }

  // Vault locked — unlock first
  if (locked || !setupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b18] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="h-6 w-6 text-violet-400" />
            <div>
              <p className="font-semibold text-white">Vault Locked</p>
              {captured && (
                <p className="text-xs text-gray-400">
                  Unlock to save <span className="text-violet-300">{captured.s || captured.u}</span>
                </p>
              )}
            </div>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showMaster ? 'text' : 'password'}
                value={masterPw}
                onChange={(e) => setMasterPw(e.target.value)}
                placeholder="Master password"
                autoFocus
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowMaster((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {unlockErr && <p className="text-xs text-red-400">{unlockErr}</p>}
            <button
              type="submit"
              disabled={unlocking || !masterPw}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Unlock & Save
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Vault unlocked — save form
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b18] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-8">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-violet-400" />
          <p className="font-semibold text-white">Save to DhyeyVault</p>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Site name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username / email"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={saving || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Save Password
          </button>
          <button
            type="button"
            onClick={() => router.push('/passwords')}
            className="w-full rounded-lg py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2, X } from 'lucide-react';
import { usePasswords } from '@/contexts/PasswordContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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

function getSiteName(captured: Captured): string {
  try { return captured.s || new URL(captured.u).hostname; } catch { return captured.u || 'this site'; }
}

export default function SavePage() {
  const router = useRouter();
  const { session } = useAuth();
  const { locked, setupDone, unlock, checkSetup, addEntry } = usePasswords();

  const [captured, setCaptured] = useState<Captured | null>(null);
  const [masterPw, setMasterPw] = useState('');
  const [showMaster, setShowMaster] = useState(false);
  const [unlockErr, setUnlockErr] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const savedRef = useRef(false);

  // Read hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const data: Captured = JSON.parse(decodeURIComponent(escape(atob(hash))));
        setCaptured(data);
      } catch {
        // no credentials — manual mode
      }
    }
    history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (session) checkSetup();
  }, [session, checkSetup]);

  // Auto-save as soon as vault is unlocked and we have credentials
  useEffect(() => {
    if (!locked && captured?.p && !savedRef.current) {
      savedRef.current = true;
      doSave(captured);
    }
  }, [locked, captured]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doSave(cred: Captured) {
    setStatus('saving');
    try {
      await addEntry({
        siteName: getSiteName(cred),
        siteUrl: cred.u || '',
        username: cred.n || '',
        plainPassword: cred.p,
        category: 'other',
        notes: '',
        favorite: false,
        strength: calcStrength(cred.p),
      });
      setStatus('saved');
      // Close the tab after 1.8 s — works if opened by window.open()
      setTimeout(() => {
        try { window.close(); } catch { /* ignore */ }
        // Fallback: navigate to passwords page
        setTimeout(() => router.push('/passwords'), 800);
      }, 1800);
    } catch {
      setStatus('error');
      savedRef.current = false;
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setUnlockErr('');
    const ok = await unlock(masterPw);
    setUnlocking(false);
    if (!ok) setUnlockErr('Wrong master password');
    // If ok, the useEffect above fires automatically
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <Screen>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-7 w-7 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Sign in first</p>
            <p className="text-xs text-gray-400 mt-1">You need to be logged in to save passwords</p>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white"
          >
            Go to Login
          </button>
        </div>
      </Screen>
    );
  }

  // ── Saving ───────────────────────────────────────────────────────────────────
  if (status === 'saving') {
    return (
      <Screen>
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-violet-400 animate-spin mx-auto" />
          <div>
            <p className="font-semibold text-white">Saving password…</p>
            {captured && (
              <p className="text-xs text-gray-400 mt-1">{getSiteName(captured)}</p>
            )}
          </div>
        </div>
      </Screen>
    );
  }

  // ── Saved ────────────────────────────────────────────────────────────────────
  if (status === 'saved') {
    return (
      <Screen>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">Saved!</p>
            {captured && (
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-white font-medium">{captured.n || 'Password'}</span>
                {' '}for{' '}
                <span className="text-violet-300">{getSiteName(captured)}</span>
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500">Closing tab…</p>
          <button
            onClick={() => { try { window.close(); } catch { router.push('/passwords'); } }}
            className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Close tab
          </button>
        </div>
      </Screen>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <Screen>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto">
            <X className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Save failed</p>
            <p className="text-xs text-gray-400 mt-1">Check your vault is unlocked and try again</p>
          </div>
          <button
            onClick={() => { savedRef.current = false; if (captured) doSave(captured); }}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </Screen>
    );
  }

  // ── Vault locked — enter master password ──────────────────────────────────────
  if (locked || !setupDone) {
    return (
      <Screen>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Vault locked</p>
              {captured && (
                <p className="text-xs text-gray-400">
                  Unlock to save{' '}
                  <span className="text-violet-300 font-medium">{getSiteName(captured)}</span>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="relative">
              <input
                type={showMaster ? 'text' : 'password'}
                value={masterPw}
                onChange={(e) => setMasterPw(e.target.value)}
                placeholder="Master password"
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowMaster((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                {showMaster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {unlockErr && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <X className="h-3 w-3" />{unlockErr}
              </p>
            )}

            <button
              type="submit"
              disabled={unlocking || !masterPw}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:scale-[0.98]"
            >
              {unlocking
                ? <><Loader2 className="h-4 w-4 animate-spin" />Unlocking…</>
                : <><Lock className="h-4 w-4" />Unlock &amp; Save</>}
            </button>
          </form>
        </div>
      </Screen>
    );
  }

  // ── Unlocked but no captured credentials (manual entry) ────────────────────
  return (
    <Screen>
      <p className="text-center text-sm text-gray-400">
        No credentials detected. Use the Safari bookmarklet while on a login page.
      </p>
      <button
        onClick={() => router.push('/passwords')}
        className="mt-4 w-full rounded-xl border border-white/10 py-3 text-sm text-gray-300 hover:text-white"
      >
        Go to Passwords
      </button>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 bg-[#080b18]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'rgba(20,29,53,0.9)', border: '1px solid rgba(30,45,77,0.8)' }}
      >
        {children}
      </div>
    </div>
  );
}

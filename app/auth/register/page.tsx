'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 10
      ? 2
      : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await registerUser(name, email, password);
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
    } else {
      await refreshSession();
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center p-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center glow-purple">
              <Shield size={22} />
            </div>
            <span className="font-bold text-xl gradient-text">DhyeyVault</span>
          </Link>
          <h1 className="text-2xl font-bold text-vault-text">Create your vault</h1>
          <p className="text-vault-muted mt-1 text-sm">
            Secure, private, AI-powered document storage
          </p>
        </div>

        <div className="glass rounded-2xl p-8 glow-purple">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-vault-red/10 border border-vault-red/30 rounded-lg px-4 py-3 text-sm text-vault-red">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-vault-text mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple transition-colors"
                placeholder="Dhyey Patel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vault-text mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vault-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-vault-card border border-vault-border rounded-xl px-4 py-3 pr-11 text-sm text-vault-text placeholder:text-vault-muted focus:outline-none focus:border-vault-purple transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          strength >= level
                            ? level === 1
                              ? '#ef4444'
                              : level === 2
                              ? '#f59e0b'
                              : '#10b981'
                            : '#1e2d4d',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {[
                { ok: name.length > 0, label: 'Name provided' },
                { ok: email.includes('@'), label: 'Valid email' },
                { ok: password.length >= 6, label: 'Password at least 6 characters' },
              ].map(({ ok, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    size={13}
                    className={ok ? 'text-vault-green' : 'text-vault-muted'}
                  />
                  <span className={ok ? 'text-vault-green' : 'text-vault-muted'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Vault
            </button>
          </form>

          <p className="text-center text-sm text-vault-muted mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-vault-purple-light hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

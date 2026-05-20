'use client';

import { useState, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, Loader2, Clock, Copy } from 'lucide-react';
import type { PasswordEntry } from '@/lib/types';

interface HealthResult {
  score: number;
  total: number;
  weak: PasswordEntry[];
  reused: { entries: PasswordEntry[] }[];
  old: PasswordEntry[];
}

interface Props {
  entries: PasswordEntry[];
  getPlainPassword: (entry: PasswordEntry) => Promise<string>;
  onEditEntry: (entry: PasswordEntry) => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'At Risk';
}

function ScoreCircle({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2d4d" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50" y="47" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{score}</text>
      <text x="50" y="63" textAnchor="middle" fill="#8899bb" fontSize="11">/100</text>
    </svg>
  );
}

export function HealthDashboard({ entries, getPlainPassword, onEditEntry }: Props) {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandWeak, setExpandWeak] = useState(false);
  const [expandReused, setExpandReused] = useState(false);
  const [expandOld, setExpandOld] = useState(false);

  const runAnalysis = useCallback(async () => {
    if (entries.length === 0) return;
    setAnalyzing(true);
    try {
      const decrypted = await Promise.all(
        entries.map(async (e) => ({ entry: e, plain: await getPlainPassword(e) }))
      );

      const weak = decrypted
        .filter(({ entry }) => (entry.strength ?? 0) < 2)
        .map((d) => d.entry);

      const byPlain = new Map<string, PasswordEntry[]>();
      for (const { entry, plain } of decrypted) {
        if (!byPlain.has(plain)) byPlain.set(plain, []);
        byPlain.get(plain)!.push(entry);
      }
      const reused = [...byPlain.values()]
        .filter((group) => group.length > 1)
        .map((entries) => ({ entries }));

      const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const old = decrypted
        .filter(({ entry }) => now - new Date(entry.updatedAt).getTime() > NINETY_DAYS)
        .map((d) => d.entry);

      const reusedCount = reused.reduce((s, g) => s + g.entries.length, 0);
      const score = Math.max(
        0,
        Math.min(100, 100 - weak.length * 12 - reusedCount * 15 - old.length * 4)
      );

      setResult({ score, total: entries.length, weak, reused, old });
    } finally {
      setAnalyzing(false);
    }
  }, [entries, getPlainPassword]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-vault-muted">
        <ShieldCheck size={48} />
        <p className="text-sm">Add passwords to run a security health check.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-vault-purple/20 flex items-center justify-center">
          <ShieldCheck size={32} className="text-vault-purple-light" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-vault-text mb-1">Password Security Check</p>
          <p className="text-sm text-vault-muted">
            Analyse {entries.length} password{entries.length !== 1 ? 's' : ''} for weaknesses, reuse, and age.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {analyzing ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          {analyzing ? 'Analysing…' : 'Run Health Check'}
        </button>
      </div>
    );
  }

  const color = scoreColor(result.score);
  const label = scoreLabel(result.score);

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-vault-text">Security Health</h2>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-1.5 text-xs text-vault-muted hover:text-vault-text transition-colors"
        >
          {analyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Re-run
        </button>
      </div>

      {/* Score card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-6">
        <ScoreCircle score={result.score} />
        <div>
          <p className="text-3xl font-bold" style={{ color }}>{label}</p>
          <p className="text-sm text-vault-muted mt-1">
            {result.total} password{result.total !== 1 ? 's' : ''} analysed
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-vault-muted">
              <span className="w-2 h-2 rounded-full bg-vault-red" />
              {result.weak.length} weak
            </span>
            <span className="flex items-center gap-1.5 text-vault-muted">
              <span className="w-2 h-2 rounded-full bg-vault-gold" />
              {result.reused.reduce((s, g) => s + g.entries.length, 0)} reused
            </span>
            <span className="flex items-center gap-1.5 text-vault-muted">
              <span className="w-2 h-2 rounded-full bg-vault-blue" />
              {result.old.length} old
            </span>
          </div>
        </div>
      </div>

      {/* Weak passwords */}
      {result.weak.length > 0 && (
        <IssueCard
          icon={<AlertTriangle size={16} className="text-vault-red" />}
          title="Weak Passwords"
          count={result.weak.length}
          color="#ef4444"
          expanded={expandWeak}
          onToggle={() => setExpandWeak(!expandWeak)}
          description="These passwords are easy to guess or brute-force."
        >
          {result.weak.map((e) => (
            <EntryRow key={e.id} entry={e} onEdit={() => onEditEntry(e)} actionLabel="Update" />
          ))}
        </IssueCard>
      )}

      {/* Reused passwords */}
      {result.reused.length > 0 && (
        <IssueCard
          icon={<Copy size={16} className="text-vault-gold" />}
          title="Reused Passwords"
          count={result.reused.reduce((s, g) => s + g.entries.length, 0)}
          color="#f59e0b"
          expanded={expandReused}
          onToggle={() => setExpandReused(!expandReused)}
          description="The same password is used on multiple sites. A breach on one exposes all."
        >
          {result.reused.map((group, i) => (
            <div key={i} className="space-y-1.5 pb-2 border-b border-vault-border last:border-0">
              <p className="text-xs text-vault-muted px-1">Same password used on {group.entries.length} sites:</p>
              {group.entries.map((e) => (
                <EntryRow key={e.id} entry={e} onEdit={() => onEditEntry(e)} actionLabel="Change" />
              ))}
            </div>
          ))}
        </IssueCard>
      )}

      {/* Old passwords */}
      {result.old.length > 0 && (
        <IssueCard
          icon={<Clock size={16} className="text-vault-blue" />}
          title="Old Passwords"
          count={result.old.length}
          color="#3b82f6"
          expanded={expandOld}
          onToggle={() => setExpandOld(!expandOld)}
          description="Not updated in 90+ days. Consider rotating these periodically."
        >
          {result.old.map((e) => (
            <EntryRow key={e.id} entry={e} onEdit={() => onEditEntry(e)} actionLabel="Update" />
          ))}
        </IssueCard>
      )}

      {result.weak.length === 0 && result.reused.length === 0 && result.old.length === 0 && (
        <div className="glass rounded-xl p-5 flex items-center gap-3">
          <ShieldCheck size={24} className="text-vault-green shrink-0" />
          <div>
            <p className="font-medium text-vault-text text-sm">All clear!</p>
            <p className="text-xs text-vault-muted mt-0.5">No issues found. Keep up the good security hygiene.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueCard({
  icon, title, count, color, expanded, onToggle, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-vault-card/50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-vault-text">{title}</p>
          <p className="text-xs text-vault-muted">{description}</p>
        </div>
        <span className="text-sm font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}>
          {count}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-vault-border pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, onEdit, actionLabel }: { entry: PasswordEntry; onEdit: () => void; actionLabel: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded bg-vault-border flex items-center justify-center shrink-0 text-xs font-bold text-vault-muted uppercase">
          {entry.siteName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-vault-text truncate">{entry.siteName}</p>
          <p className="text-xs text-vault-muted truncate">{entry.username}</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-vault-purple-light hover:text-vault-purple transition-colors ml-3 shrink-0"
      >
        {actionLabel}
      </button>
    </div>
  );
}

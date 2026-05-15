'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Vault,
  Bot,
  Plus,
  FileText,
  TrendingUp,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentCard } from '@/components/vault/DocumentCard';
import { UploadModal } from '@/components/vault/UploadModal';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';
import type { DocumentCategory } from '@/lib/types';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-vault-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-vault-text">{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { documents, loading } = useVault();
  const { session } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);

  const favorites = documents.filter((d) => d.favorite);
  const recent = documents.slice(0, 6);

  const categoryCounts = documents.reduce(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    },
    {} as Record<DocumentCategory, number>
  );

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) as [DocumentCategory, number][];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell title="Dashboard">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-vault-text">
              {greeting},{' '}
              <span className="gradient-text">{session?.name?.split(' ')[0]}</span> 👋
            </h2>
            <p className="text-sm text-vault-muted mt-0.5">
              {documents.length} document{documents.length !== 1 ? 's' : ''} secured in
              your vault
            </p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium w-fit"
          >
            <Plus size={16} />
            Add Document
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Documents"
            value={documents.length}
            icon={FileText}
            color="#7c3aed"
          />
          <StatCard
            label="Favourites"
            value={favorites.length}
            icon={Star}
            color="#f59e0b"
          />
          <StatCard
            label="Categories"
            value={Object.keys(categoryCounts).length}
            icon={Vault}
            color="#10b981"
          />
          <StatCard
            label="This Month"
            value={
              documents.filter((d) => {
                const created = new Date(d.createdAt);
                const now = new Date();
                return (
                  created.getMonth() === now.getMonth() &&
                  created.getFullYear() === now.getFullYear()
                );
              }).length
            }
            icon={TrendingUp}
            color="#2563eb"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-vault-text flex items-center gap-2">
                <Clock size={16} className="text-vault-muted" />
                Recent Documents
              </h3>
              <Link
                href="/vault"
                className="text-xs text-vault-purple-light hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton rounded-xl h-36" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <Upload size={36} className="mx-auto mb-3 text-vault-muted" />
                <p className="text-vault-text font-medium mb-1">Vault is empty</p>
                <p className="text-sm text-vault-muted mb-4">
                  Upload your first document to get started
                </p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="btn-primary px-5 py-2 rounded-lg text-sm"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recent.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-vault-text flex items-center gap-2">
              <Vault size={16} className="text-vault-muted" />
              Categories
            </h3>

            <div className="glass rounded-xl p-4 space-y-3">
              {topCategories.length === 0 ? (
                <p className="text-sm text-vault-muted text-center py-4">
                  No documents yet
                </p>
              ) : (
                topCategories.map(([cat, count]) => {
                  const color = CATEGORY_COLORS[cat];
                  const pct = Math.round((count / documents.length) * 100);
                  return (
                    <Link key={cat} href={`/vault?category=${cat}`}>
                      <div className="space-y-1 hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vault-text">{CATEGORY_LABELS[cat]}</span>
                          <span className="text-vault-muted">
                            {count} doc{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-1.5 bg-vault-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="glass rounded-xl p-4 border border-vault-purple/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-vault-purple-light" />
                <span className="text-sm font-medium text-vault-text">
                  AI Assistant
                </span>
              </div>
              <p className="text-xs text-vault-muted mb-3 leading-relaxed">
                Ask questions about your documents, get summaries, or find anything in your
                vault instantly.
              </p>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-2 text-xs text-vault-purple-light hover:underline"
              >
                <Bot size={13} />
                Open AI Assistant <ChevronRight size={12} />
              </Link>
            </div>

            {favorites.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-vault-text flex items-center gap-2">
                  <Star size={16} className="text-vault-gold" />
                  Favourites
                </h3>
                <div className="space-y-2">
                  {favorites.slice(0, 3).map((doc) => (
                    <Link key={doc.id} href={`/vault/${doc.id}`}>
                      <div className="glass rounded-lg px-3 py-2.5 flex items-center gap-2.5 hover:border-vault-purple/30 transition-colors">
                        <FileText size={14} className="text-vault-muted shrink-0" />
                        <p className="text-sm text-vault-text truncate">{doc.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </AppShell>
  );
}

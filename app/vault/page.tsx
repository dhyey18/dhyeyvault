'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Star,
  Upload,
  SlidersHorizontal,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentCard } from '@/components/vault/DocumentCard';
import { UploadModal } from '@/components/vault/UploadModal';
import { useVault } from '@/contexts/VaultContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';
import type { DocumentCategory } from '@/lib/types';

const ALL_CATEGORIES: DocumentCategory[] = [
  'identity', 'financial', 'medical', 'legal', 'personal', 'other',
];

const CATEGORY_EMOJI: Record<DocumentCategory, string> = {
  identity: '🪪',
  financial: '💳',
  medical: '🏥',
  legal: '⚖️',
  personal: '📁',
  other: '📄',
};

function VaultContent() {
  const { documents, loading } = useVault();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>(
    (searchParams.get('category') as DocumentCategory) || 'all'
  );
  const [favOnly, setFavOnly] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category') as DocumentCategory | null;
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let docs = [...documents];
    if (activeCategory !== 'all') docs = docs.filter((d) => d.category === activeCategory);
    if (favOnly) docs = docs.filter((d) => d.favorite);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.aiSummary?.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.notes.toLowerCase().includes(q)
      );
    }
    docs.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.fileSize - a.fileSize;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return docs;
  }, [documents, activeCategory, favOnly, search, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    for (const cat of ALL_CATEGORIES) c[cat] = documents.filter((d) => d.category === cat).length;
    return c;
  }, [documents]);

  return (
    <AppShell title="My Vault">
      <div className="flex h-full">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-vault-border p-3 space-y-1">
          <button
            onClick={() => { setActiveCategory('all'); setFavOnly(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === 'all' && !favOnly
                ? 'bg-vault-purple/20 text-vault-purple-light'
                : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
            }`}
          >
            <span>All Documents</span>
            <span className="text-xs">{counts.all}</span>
          </button>

          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              favOnly
                ? 'bg-vault-gold/20 text-vault-gold'
                : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
            }`}
          >
            <span className="flex items-center gap-2"><Star size={13} />Favourites</span>
            <span className="text-xs">{documents.filter((d) => d.favorite).length}</span>
          </button>

          <div className="pt-2">
            <p className="text-xs text-vault-muted px-3 mb-1 font-medium uppercase tracking-wider">Categories</p>
            {ALL_CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(active ? 'all' : cat); setFavOnly(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-vault-card text-vault-text' : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-vault-muted">{counts[cat]}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 px-4 pt-4 pb-3 border-b border-vault-border">
            {/* Row 1: Search + Upload */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 bg-vault-card border border-vault-border rounded-xl px-3 py-2.5">
                <Search size={15} className="text-vault-muted shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-muted outline-none min-w-0"
                  placeholder="Search documents…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="btn-primary flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>

            {/* Row 2: Category chips (mobile) + sort + view controls */}
            <div className="flex items-center gap-2">
              {/* Scrollable category chips — mobile only */}
              <div className="flex-1 overflow-x-auto lg:hidden scrollbar-hide">
                <div className="flex items-center gap-1.5 w-max">
                  <button
                    onClick={() => { setActiveCategory('all'); setFavOnly(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      activeCategory === 'all' && !favOnly
                        ? 'bg-vault-purple text-white'
                        : 'bg-vault-card text-vault-muted border border-vault-border'
                    }`}
                  >
                    All ({counts.all})
                  </button>
                  <button
                    onClick={() => setFavOnly(!favOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      favOnly
                        ? 'bg-vault-gold text-black'
                        : 'bg-vault-card text-vault-muted border border-vault-border'
                    }`}
                  >
                    ⭐ Fav
                  </button>
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(activeCategory === cat ? 'all' : cat); setFavOnly(false); }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? 'text-white'
                          : 'bg-vault-card text-vault-muted border border-vault-border'
                      }`}
                      style={activeCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                    >
                      {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort + view controls (always visible) */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <select
                  className="bg-vault-card border border-vault-border rounded-lg px-2 py-2 text-xs text-vault-text outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
                >
                  <option value="date">Newest</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
                <div className="flex items-center bg-vault-card border border-vault-border rounded-lg p-1 gap-0.5">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-1.5 rounded transition-colors ${
                      view === 'grid' ? 'bg-vault-purple text-white' : 'text-vault-muted'
                    }`}
                  >
                    <Grid3X3 size={13} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-1.5 rounded transition-colors ${
                      view === 'list' ? 'bg-vault-purple text-white' : 'text-vault-muted'
                    }`}
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Document grid/list */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className={`grid gap-3 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton rounded-xl h-36" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                {documents.length === 0 ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-vault-card border border-vault-border flex items-center justify-center">
                      <Upload size={28} className="text-vault-muted" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-vault-text mb-1">Vault is empty</p>
                      <p className="text-sm text-vault-muted">Upload your first document to get started</p>
                    </div>
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="btn-primary px-6 py-3 rounded-xl text-sm font-medium"
                    >
                      Upload Document
                    </button>
                  </>
                ) : (
                  <>
                    <Filter size={32} className="text-vault-muted" />
                    <p className="text-vault-muted text-sm">No documents match your filters</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-vault-muted mb-3">
                  {filtered.length} document{filtered.length !== 1 ? 's' : ''}
                  {activeCategory !== 'all' && ` · ${CATEGORY_LABELS[activeCategory]}`}
                  {favOnly && ' · Favourites'}
                </p>
                <div className={`grid gap-3 ${
                  view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                }`}>
                  {filtered.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </AppShell>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-vault-bg" />}>
      <VaultContent />
    </Suspense>
  );
}

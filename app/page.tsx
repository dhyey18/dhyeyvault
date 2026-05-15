'use client';

import Link from 'next/link';
import {
  Shield,
  Sparkles,
  Lock,
  Bot,
  FileSearch,
  ChevronRight,
  Star,
  Zap,
  Eye,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Smart Upload',
    desc: 'Drop any document and Gemini AI instantly names it, categorizes it, and generates a summary.',
    color: '#7c3aed',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    desc: 'Chat with your vault. Ask questions, get summaries, find documents — all via natural language.',
    color: '#2563eb',
  },
  {
    icon: FileSearch,
    title: 'OCR & Extraction',
    desc: 'Extract text from scanned documents and images with Gemini Vision technology.',
    color: '#10b981',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    desc: 'Your documents stay on your device. No cloud uploads, no tracking, fully private.',
    color: '#f59e0b',
  },
  {
    icon: Eye,
    title: 'Smart Organization',
    desc: 'Auto-categorized by Identity, Financial, Medical, Legal and more. Always find what you need.',
    color: '#ef4444',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    desc: 'Lightning-fast retrieval of any document with intelligent search and filtering.',
    color: '#a855f7',
  },
];

const CATEGORIES = [
  { label: 'Identity', color: '#3b82f6', count: 'Passports, IDs, Licenses' },
  { label: 'Financial', color: '#10b981', count: 'Bank docs, Tax returns' },
  { label: 'Medical', color: '#ef4444', count: 'Reports, Prescriptions' },
  { label: 'Legal', color: '#f59e0b', count: 'Contracts, Agreements' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vault-bg text-vault-text">
      <nav className="sticky top-0 z-30 glass border-b border-vault-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center glow-purple">
              <Shield size={18} />
            </div>
            <span className="font-bold text-lg gradient-text">DhyeyVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-vault-muted hover:text-vault-text transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="btn-primary px-4 py-2 text-sm rounded-lg font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-24 sm:py-32 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-10 bg-vault-purple pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 bg-vault-blue pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-vault-purple/10 border border-vault-purple/30 rounded-full px-4 py-1.5 text-sm text-vault-purple-light mb-6">
            <Sparkles size={14} />
            Powered by Gemini 2.5 Flash AI
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Your Personal{' '}
            <span className="gradient-text">Digital Vault</span>
            <br />
            Secured & AI-Powered
          </h1>

          <p className="text-lg text-vault-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Store, organize, and instantly access all your important documents. With
            AI-powered analysis, smart categorization, and natural language search — your
            entire document life organized in one private vault.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
            >
              Start Your Vault <ChevronRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3.5 rounded-xl font-semibold text-base border border-vault-border text-vault-text hover:bg-vault-card transition-colors"
            >
              Sign In
            </Link>
          </div>

          <p className="text-xs text-vault-muted mt-4">
            100% private · All data stored locally · No sign-up required to explore
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="glass glass-hover rounded-xl p-4 text-center"
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                </div>
                <p className="font-semibold text-vault-text text-sm mb-1">{cat.label}</p>
                <p className="text-xs text-vault-muted">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Everything you need,{' '}
              <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
            <p className="text-vault-muted max-w-xl mx-auto">
              A focused, powerful vault for your most important documents — with AI that
              actually understands them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass glass-hover rounded-xl p-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-semibold text-vault-text mb-2">{title}</h3>
                <p className="text-sm text-vault-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-2xl p-10 glow-purple">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-vault-gold fill-vault-gold" />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to secure your documents?
            </h2>
            <p className="text-vault-muted mb-8">
              Organize all your important documents with AI-powered intelligence.
            </p>
            <Link
              href="/auth/register"
              className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-base inline-flex items-center gap-2"
            >
              Create Your Vault <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-vault-border py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield size={16} className="text-vault-purple" />
          <span className="font-semibold gradient-text">DhyeyVault</span>
        </div>
        <p className="text-xs text-vault-muted">
          Personal Digital Vault · AI-Powered · Private by Design
        </p>
      </footer>
    </div>
  );
}

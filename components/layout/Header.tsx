'use client';

import { Menu, Bell, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { session } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 border-b border-vault-border bg-vault-surface/90 backdrop-blur-xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Mobile: logo mark left, title center, avatar right */}
        <Link href="/dashboard" className="lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
            <Shield size={16} />
          </div>
        </Link>

        {/* Desktop: hamburger hidden, title left */}
        <button
          onClick={onMenuClick}
          className="hidden text-vault-muted hover:text-vault-text p-1.5 rounded-lg hover:bg-vault-card transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="flex-1 text-base font-semibold text-vault-text lg:text-lg">{title}</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="lg:hidden relative p-2 rounded-xl hover:bg-vault-card transition-colors text-vault-muted hover:text-vault-text"
            aria-label="Menu"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-vault-purple" />
          </button>

          <button
            onClick={onMenuClick}
            className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold shrink-0"
            aria-label="Profile menu"
          >
            {session?.name?.[0]?.toUpperCase() ?? 'U'}
          </button>
        </div>
      </div>
    </header>
  );
}

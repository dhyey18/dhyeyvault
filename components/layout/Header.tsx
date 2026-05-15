'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-4 sm:px-6 py-3.5 border-b border-vault-border bg-vault-surface/80 backdrop-blur-md">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-vault-muted hover:text-vault-text p-1.5 rounded-lg hover:bg-vault-card transition-colors"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-semibold text-vault-text">{title}</h1>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2 bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-muted w-48 xl:w-64">
        <Search size={15} />
        <span>Search vault…</span>
      </div>

      <button className="relative text-vault-muted hover:text-vault-text p-2 rounded-lg hover:bg-vault-card transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-vault-purple" />
      </button>

      <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold shrink-0">
        {session?.name?.[0]?.toUpperCase() ?? 'U'}
      </div>
    </header>
  );
}

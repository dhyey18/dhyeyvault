'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Vault,
  Bot,
  LogOut,
  Shield,
  ChevronRight,
  X,
  KeyRound,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vault', label: 'My Vault', icon: Vault },
  { href: '/passwords', label: 'Passwords', icon: KeyRound },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 flex flex-col
          bg-vault-surface border-r border-vault-border
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:w-64
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center glow-purple shrink-0">
              <Shield size={16} />
            </div>
            <span className="font-bold text-lg gradient-text">DhyeyVault</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-vault-card transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items — desktop only (mobile uses bottom tab bar) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 hidden lg:block">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${
                    active
                      ? 'bg-vault-purple/20 text-vault-purple-light border border-vault-purple/20'
                      : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
                  }
                `}
              >
                <Icon size={18} className={active ? 'text-vault-purple-light' : ''} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* Mobile: user info + sign out (primary content of drawer on mobile) */}
        <div className="lg:hidden flex-1 p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl glass">
            <div className="w-12 h-12 rounded-full btn-primary flex items-center justify-center text-base font-bold shrink-0">
              {session?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-vault-text truncate">{session?.name ?? 'User'}</p>
              <p className="text-sm text-vault-muted truncate">{session?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-vault-muted uppercase tracking-wider px-2 mb-2">Account</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-vault-muted hover:text-vault-red hover:bg-vault-red/10 transition-colors border border-vault-border"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>

        {/* Desktop: user + sign out footer */}
        <div className="hidden lg:block p-3 border-t border-vault-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass mb-1">
            <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold shrink-0">
              {session?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vault-text truncate">{session?.name ?? 'User'}</p>
              <p className="text-xs text-vault-muted truncate">{session?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-vault-muted hover:text-vault-red hover:bg-vault-red/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

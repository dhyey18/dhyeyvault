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
    await logout();
    router.push('/');
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 flex flex-col
          bg-vault-surface border-r border-vault-border
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-vault-border">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center glow-purple">
              <Shield size={18} />
            </div>
            <span className="font-bold text-lg gradient-text">DhyeyVault</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-vault-muted hover:text-vault-text p-1"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${
                    active
                      ? 'bg-vault-purple/20 text-vault-purple-light border border-vault-purple/30'
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

        <div className="p-3 border-t border-vault-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg glass mb-2">
            <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-xs font-bold shrink-0">
              {session?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vault-text truncate">
                {session?.name ?? 'User'}
              </p>
              <p className="text-xs text-vault-muted truncate">{session?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-vault-muted hover:text-vault-red hover:bg-vault-red/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

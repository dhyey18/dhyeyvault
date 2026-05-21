'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vault, KeyRound, Bot } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/vault', label: 'Vault', icon: Vault },
  { href: '/passwords', label: 'Passwords', icon: KeyRound },
  { href: '/ai-assistant', label: 'AI', icon: Bot },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-vault-surface/95 backdrop-blur-xl border-t border-vault-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                active ? 'text-vault-purple-light' : 'text-vault-muted'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 ${
                active ? 'bg-vault-purple/20' : ''
              }`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

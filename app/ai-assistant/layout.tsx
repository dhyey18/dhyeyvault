'use client';

import { VaultProvider } from '@/contexts/VaultContext';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}

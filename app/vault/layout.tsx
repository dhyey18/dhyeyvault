'use client';

import { VaultProvider } from '@/contexts/VaultContext';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}

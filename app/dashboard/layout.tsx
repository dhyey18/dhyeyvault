'use client';

import { VaultProvider } from '@/contexts/VaultContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <VaultProvider>{children}</VaultProvider>;
}

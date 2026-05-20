'use client';

import { PasswordProvider } from '@/contexts/PasswordContext';

export default function SaveLayout({ children }: { children: React.ReactNode }) {
  return <PasswordProvider>{children}</PasswordProvider>;
}

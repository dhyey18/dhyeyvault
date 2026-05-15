'use client';

import { PasswordProvider } from '@/contexts/PasswordContext';

export default function PasswordsLayout({ children }: { children: React.ReactNode }) {
  return <PasswordProvider>{children}</PasswordProvider>;
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/serverAuth';

const PROTECTED_PREFIXES = ['/dashboard', '/vault', '/passwords', '/ai-assistant'];
const AUTH_PREFIXES = ['/auth/login', '/auth/register'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
  const user = token ? await verifyToken(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Unauthenticated user hitting a protected page → login
  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting login/register → dashboard
  if (isAuthPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.delete('from');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vault/:path*',
    '/passwords/:path*',
    '/ai-assistant/:path*',
    '/auth/:path*',
  ],
};

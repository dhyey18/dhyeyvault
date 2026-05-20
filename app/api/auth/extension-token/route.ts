import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, signExtensionToken } from '@/lib/serverAuth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = await signExtensionToken(user);
  return NextResponse.json({ token });
}

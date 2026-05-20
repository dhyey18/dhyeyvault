import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUserOrBearer, CORS_HEADERS } from '@/lib/serverAuth';

interface PasswordMeta {
  userId: string;
  salt: string;
  verifier: string;
  verifierIv: string;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUserOrBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  const col = await getCollection<PasswordMeta>('password_meta');
  const meta = await col.findOne({ userId: user.userId });
  if (!meta) return NextResponse.json(null, { headers: CORS_HEADERS });
  const { _id, ...rest } = meta;
  return NextResponse.json(rest, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserOrBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  const { salt, verifier, verifierIv }: Omit<PasswordMeta, 'userId'> = await req.json();
  const col = await getCollection<PasswordMeta>('password_meta');
  await col.replaceOne(
    { userId: user.userId },
    { userId: user.userId, salt, verifier, verifierIv },
    { upsert: true }
  );
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

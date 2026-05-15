import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';

interface PasswordMeta {
  userId: string;
  salt: string;
  verifier: string;
  verifierIv: string;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const col = await getCollection<PasswordMeta>('password_meta');
  const meta = await col.findOne({ userId: user.userId });
  if (!meta) return NextResponse.json(null);
  const { _id, ...rest } = meta;
  return NextResponse.json(rest);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { salt, verifier, verifierIv }: Omit<PasswordMeta, 'userId'> = await req.json();
  const col = await getCollection<PasswordMeta>('password_meta');
  await col.replaceOne(
    { userId: user.userId },
    { userId: user.userId, salt, verifier, verifierIv },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

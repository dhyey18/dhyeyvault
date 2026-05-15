import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';

interface EncryptedRow {
  id: string;
  userId: string;
  data: string;
  iv: string;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const col = await getCollection<EncryptedRow>('passwords');
  const rows = await col.find({ userId: user.userId }).toArray();
  return NextResponse.json(rows.map(({ _id, ...r }) => r));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, data, iv }: EncryptedRow = await req.json();
  if (!id || !data || !iv) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const col = await getCollection<EncryptedRow>('passwords');
  await col.replaceOne(
    { id, userId: user.userId },
    { id, userId: user.userId, data, iv },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

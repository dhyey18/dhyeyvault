import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUserOrBearer, CORS_HEADERS } from '@/lib/serverAuth';

interface EncryptedRow {
  id: string;
  userId: string;
  data: string;
  iv: string;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUserOrBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  const col = await getCollection<EncryptedRow>('passwords');
  const rows = await col.find({ userId: user.userId }).toArray();
  return NextResponse.json(rows.map(({ _id, ...r }) => r), { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserOrBearer(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

  const { id, data, iv }: EncryptedRow = await req.json();
  if (!id || !data || !iv) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: CORS_HEADERS });
  }

  const col = await getCollection<EncryptedRow>('passwords');
  await col.replaceOne(
    { id, userId: user.userId },
    { id, userId: user.userId, data, iv },
    { upsert: true }
  );
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

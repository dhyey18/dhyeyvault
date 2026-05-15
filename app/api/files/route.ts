import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';

interface FileRow {
  id: string;
  userId: string;
  data: string;
  mimeType: string;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, data, mimeType }: FileRow = await req.json();
  if (!id || !data) return NextResponse.json({ error: 'Missing id or data' }, { status: 400 });

  const col = await getCollection<FileRow>('files');
  await col.replaceOne(
    { id, userId: user.userId },
    { id, userId: user.userId, data, mimeType },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

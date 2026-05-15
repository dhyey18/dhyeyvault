import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';

interface FileRow {
  id: string;
  userId: string;
  data: string;
  mimeType: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const col = await getCollection<FileRow>('files');
  const file = await col.findOne({ id, userId: user.userId });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: file.id, data: file.data, mimeType: file.mimeType });
}

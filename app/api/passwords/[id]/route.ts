import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';

interface EncryptedRow {
  id: string;
  userId: string;
  data: string;
  iv: string;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, iv }: { data: string; iv: string } = await req.json();
  const col = await getCollection<EncryptedRow>('passwords');
  await col.updateOne({ id, userId: user.userId }, { $set: { data, iv } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const col = await getCollection<EncryptedRow>('passwords');
  await col.deleteOne({ id, userId: user.userId });
  return NextResponse.json({ ok: true });
}

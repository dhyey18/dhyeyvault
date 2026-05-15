import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';
import type { VaultDocument } from '@/lib/types';

type DocRow = Omit<VaultDocument, never>;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const col = await getCollection<DocRow>('documents');
  const doc = await col.findOne({ id, userId: user.userId });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { _id, ...rest } = doc;
  return NextResponse.json(rest);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const updates: Partial<VaultDocument> = await req.json();
  const col = await getCollection<DocRow>('documents');
  await col.updateOne({ id, userId: user.userId }, { $set: { ...updates, updatedAt: new Date().toISOString() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const docsCol = await getCollection('documents');
  const filesCol = await getCollection('files');
  await Promise.all([
    docsCol.deleteOne({ id, userId: user.userId }),
    filesCol.deleteOne({ id, userId: user.userId }),
  ]);
  return NextResponse.json({ ok: true });
}

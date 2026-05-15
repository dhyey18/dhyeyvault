import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getAuthUser } from '@/lib/serverAuth';
import type { VaultDocument } from '@/lib/types';

type DocRow = Omit<VaultDocument, never>;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const col = await getCollection<DocRow>('documents');
  const docs = await col.find({ userId: user.userId }).sort({ createdAt: -1 }).toArray();
  // strip MongoDB _id before returning
  return NextResponse.json(docs.map(({ _id, ...d }) => d));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const doc: VaultDocument = await req.json();
  if (doc.userId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const col = await getCollection<DocRow>('documents');
  await col.replaceOne({ id: doc.id }, doc, { upsert: true });
  return NextResponse.json({ ok: true });
}

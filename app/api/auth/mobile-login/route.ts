import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '@/lib/db';
import { signExtensionToken, CORS_HEADERS } from '@/lib/serverAuth';

interface UserDoc {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: CORS_HEADERS });
    }

    const col = await getCollection<UserDoc>('users');
    const user = await col.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: CORS_HEADERS });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: CORS_HEADERS });
    }

    const token = await signExtensionToken({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json(
      { token, user: { id: user.id, email: user.email, name: user.name } },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Mobile login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500, headers: CORS_HEADERS });
  }
}

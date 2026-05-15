import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '@/lib/db';
import { signToken, COOKIE_NAME, cookieOptions } from '@/lib/serverAuth';

interface UserDoc {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const col = await getCollection<UserDoc>('users');
    const existing = await col.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user: UserDoc = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await col.insertOne(user);
    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(COOKIE_NAME, token, cookieOptions());
    return res;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

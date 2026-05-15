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
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const col = await getCollection<UserDoc>('users');
    const user = await col.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(COOKIE_NAME, token, cookieOptions());
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

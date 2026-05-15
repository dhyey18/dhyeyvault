import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { history, message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const reply = await chatWithAI(history || [], message, context);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: 'Missing base64 or mimeType' }, { status: 400 });
    }

    const text = await extractText(base64, mimeType);
    return NextResponse.json({ text });
  } catch (err) {
    console.error('OCR error:', err);
    return NextResponse.json({ error: 'OCR extraction failed' }, { status: 500 });
  }
}

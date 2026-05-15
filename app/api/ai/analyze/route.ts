import { NextRequest, NextResponse } from 'next/server';
import { smartCategorize, analyzeDocument } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType, fileName, fullAnalysis } = await req.json();

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: 'Missing base64 or mimeType' }, { status: 400 });
    }

    if (fullAnalysis) {
      const summary = await analyzeDocument(
        base64,
        mimeType,
        'Provide a detailed 2-3 sentence summary of this document. Include key information, dates, amounts, or names if present.'
      );
      return NextResponse.json({ summary });
    }

    const result = await smartCategorize(base64, mimeType, fileName || 'document');
    return NextResponse.json(result);
  } catch (err) {
    console.error('AI analyze error:', err);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

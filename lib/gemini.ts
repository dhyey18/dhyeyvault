import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function analyzeDocument(
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const model = getGeminiModel();

  const pureBase64 = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data;

  const result = await model.generateContent([
    {
      inlineData: {
        data: pureBase64,
        mimeType,
      },
    },
    prompt,
  ]);
  return result.response.text();
}

export async function chatWithAI(
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  userMessage: string,
  context?: string
): Promise<string> {
  const model = getGeminiModel();
  const chat = model.startChat({ history });
  const message = context
    ? `Context about the user's vault:\n${context}\n\nUser question: ${userMessage}`
    : userMessage;
  const result = await chat.sendMessage(message);
  return result.response.text();
}

export async function smartCategorize(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<{
  suggestedName: string;
  category: string;
  summary: string;
  tags: string[];
}> {
  const model = getGeminiModel();

  const pureBase64 = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data;

  const prompt = `Analyze this document and respond ONLY with a valid JSON object (no markdown, no code blocks) with these exact keys:
{
  "suggestedName": "a clear descriptive name for this document",
  "category": "one of: identity, financial, medical, legal, personal, other",
  "summary": "a 1-2 sentence summary of what this document is",
  "tags": ["tag1", "tag2", "tag3"]
}

The document filename is: ${fileName}`;

  const result = await model.generateContent([
    { inlineData: { data: pureBase64, mimeType } },
    prompt,
  ]);

  const text = result.response.text().trim();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function extractText(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const model = getGeminiModel();

  const pureBase64 = base64Data.includes(',')
    ? base64Data.split(',')[1]
    : base64Data;

  const result = await model.generateContent([
    { inlineData: { data: pureBase64, mimeType } },
    'Extract and return all visible text from this document. Preserve formatting where possible. If no text is found, describe what you see.',
  ]);
  return result.response.text();
}

import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const userId = await getSessionUser();
    const body = await req.json();
    
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || body.conversationId;
    const messages = body.messages || [];

    const coreMessages = messages.map((m: any) => {
      let content = m.content;
      if (!content && m.parts) {
        if (m.role === 'user') {
          content = m.parts;
        } else {
          content = m.parts.find((p:any) => p.type === 'text')?.text || '';
        }
      }
      return { role: m.role, content: content || '' };
    });

    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

    const result = streamText({
      // @ts-ignore - useSearchGrounding is supported by the provider but not in these types
      model: google('gemini-3.5-flash', { useSearchGrounding: true }),
      system: `You are SyncInk AI, a highly capable and helpful AI assistant created by SyncInk.

The current real-time date and time is: ${currentTime}.

**CRITICAL INSTRUCTION**: You HAVE real-time internet access via Google Search Grounding. If the user asks about recent events (like 2026 news, leaks, weather), rely on your grounded data to answer them accurately. NEVER say you don't have internet access.

Your goal is to provide clear, direct, and easy-to-understand answers.
- Answer directly and get straight to the point without unnecessary build-up.
- Keep your language simple, natural, and accessible.
- Format your responses cleanly using markdown, bullet points, and bold text for readability.
- Be extremely helpful, friendly, and precise.`,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

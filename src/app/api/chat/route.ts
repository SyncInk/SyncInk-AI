import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

const apiKey = 
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_API_KEY || 
  '';

const google = createGoogleGenerativeAI({
  apiKey,
});

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Google Generative AI API Key. Please add GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your Vercel Environment Variables.' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const rawMessages = body.messages || [];

    // Parse and normalize messages for AI SDK
    const coreMessages = rawMessages.map((m: any) => {
      // Direct string content
      if (typeof m.content === 'string' && m.content.trim()) {
        return { role: m.role, content: m.content };
      }

      // Multipart content (text + images/files)
      if (Array.isArray(m.parts) && m.parts.length > 0) {
        const textParts = m.parts
          .filter((p: any) => p.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('\n');

        const imageParts = m.parts
          .filter((p: any) => p.type === 'image' && p.image)
          .map((p: any) => ({
            type: 'image' as const,
            image: p.image,
          }));

        if (imageParts.length > 0) {
          const contentArray: any[] = [];
          if (textParts) contentArray.push({ type: 'text', text: textParts });
          contentArray.push(...imageParts);
          return { role: m.role, content: contentArray };
        }

        return { role: m.role, content: textParts || '' };
      }

      return { role: m.role, content: '' };
    }).filter((m: any) => {
      if (typeof m.content === 'string') return m.content.length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      return false;
    });

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    const systemPrompt = `You are SyncInk AI, an ultra-fast, premium next-generation AI assistant built by SyncInk.
Current Real-Time Date and Time: ${currentTime}.

Your Core Directives:
1. Provide accurate, clear, and elegant responses.
2. Get straight to the point without excessive throat-clearing, disclaimers, or filler phrases.
3. Format output cleanly with standard GitHub Flavored Markdown (bullet points, numbered lists, tables, bold headers, and code blocks with language tags).
4. You are aware of modern 2026 events and topics. Be helpful, friendly, thoughtful, and highly capable.
5. If answering code or technical questions, provide working, modern, clean code with brief explanations.`;

    const result = streamText({
      model: google('gemini-3.6-flash'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('SyncInk AI Route Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while generating response.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;
export const runtime = 'edge';

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

    const url = new URL(req.url);
    const body = await req.json();

    const rawMessages = body.messages || [];
    const webSearch = url.searchParams.get('webSearch') === 'true' || body.webSearch === true;
    const mode = url.searchParams.get('mode') || body.mode || 'fast';
    const customPrompt = url.searchParams.get('customPrompt') || body.customPrompt || '';

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

    let modeInstructions = '';
    if (mode === 'deep') {
      modeInstructions = `
[MODE: DEEP REASONING ACTIVATED]
You are operating in Deep Reasoning Mode.
Before delivering your final solution, thoroughly analyze the problem step-by-step.
Always enclose your internal reasoning, deductions, hypotheses, and edge case checks inside <thought>...</thought> tags at the very start of your response.
Then provide the clean, polished final answer outside the <thought> tags.`;
    } else if (mode === 'web' || webSearch) {
      modeInstructions = `
[MODE: LIVE WEB SEARCH GROUNDING ACTIVATED]
You have live Google Search grounding enabled.
Always search the internet for the most current, real-time facts, breaking news, scores, market prices, and 2026 developments.
Provide accurate, up-to-the-minute information and cite source names or links where available.`;
    } else if (mode === 'creative') {
      modeInstructions = `
[MODE: CREATIVE STUDIO ACTIVATED]
You are operating in Creative Studio Mode.
Write with rich sensory details, high craft, sophisticated prose, and engaging, tailored tone.`;
    } else {
      modeInstructions = `
[MODE: ULTRA-FAST ASSISTANT ACTIVATED]
Deliver fast, direct, concise, and highly actionable answers with zero fluff.`;
    }

    const systemPrompt = `You are SyncInk AI, an ultra-fast, premium next-generation AI assistant built by SyncInk.
Current Real-Time Date and Time: ${currentTime}.
${modeInstructions}

${customPrompt ? `[USER CUSTOM INSTRUCTIONS]: ${customPrompt}\n` : ''}

Formatting Directives:
1. Always format responses cleanly with standard GitHub Flavored Markdown (bullet points, numbered lists, markdown tables, bold headings, and fenced code blocks with language tags).
2. For code, always provide production-ready, clean, modern code.
3. Be friendly, brilliant, and accurate.`;

    const modelOptions: any = {};
    if (webSearch || mode === 'web') {
      modelOptions.useSearchGrounding = true;
    }

    const result = streamText({
      model: (google as any)('gemini-3.6-flash', modelOptions),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('SyncInk AI Route Error:', error);
    
    let errorMessage = error.message || 'An error occurred while generating response.';
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      errorMessage = 'SyncInk Engine Free Tier Rate Limit Exceeded. Please wait a minute before sending your next message, or upgrade your API key limit.';
    }

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

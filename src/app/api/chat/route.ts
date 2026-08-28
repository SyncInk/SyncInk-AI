import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-pro-latest'),
    system: "You are SyncInk AI, a highly advanced, powerful AI with immense knowledge about everything in the universe. You are helpful, precise, articulate, and conversational. Always provide comprehensive, accurate, and insightful answers. Use markdown formatting to make your responses easy to read.",
    messages,
  });

  return result.toDataStreamResponse();
}

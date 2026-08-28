import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const userId = await getSessionUser();
    const conv = db.getConversation(params.id, userId);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(conv);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const userId = await getSessionUser();
    const success = db.deleteConversation(params.id, userId);
    if (!success) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const userId = await getSessionUser();
    const body = await req.json();
    const conv = db.updateConversation(params.id, userId, { title: body.title });
    if (!conv) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    return NextResponse.json(conv);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

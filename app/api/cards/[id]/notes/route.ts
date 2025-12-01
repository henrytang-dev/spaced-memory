import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { parseMathpixImage } from '@/lib/mathpix';

function ensureBlockMath(text: string) {
  if (!text) return text;
  let normalized = text;
  normalized = normalized.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) => `$$\n${inner}\n$$`);
  normalized = normalized.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner) => `$${inner}$`);
  const hasBlock = /\$\$/.test(normalized);
  const hasEnv = /\\begin\{[^}]+\}/.test(normalized);
  const hasInline = /(^|[^$])\$(?!\$)([^$]+?)\$(?!\$)/.test(normalized);
  if (hasEnv && !hasBlock && !hasInline) {
    normalized = `$$\n${normalized}\n$$`;
  }
  return normalized;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const notes = await prisma.cardNote.findMany({
    where: { cardId: params.id, userId },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const contentType = req.headers.get('content-type') || '';
  let appendText = '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const content = ensureBlockMath((form.get('content') as string) || '');
    appendText += content ? `${content}\n\n` : '';
    const file = form.get('file');
    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseMathpixImage(buffer);
      const latex = parsed.latex ? ensureBlockMath(parsed.latex) : '';
      const markdown = ensureBlockMath(parsed.markdown || parsed.text || '');
      const ocrText = latex || markdown || parsed.text || '';
      appendText += ocrText ? `${ocrText}\n\n` : '';
    }
  } else {
    const body = await req.json();
    const content = ensureBlockMath(body.content || '');
    appendText += content;
  }

  if (!appendText.trim()) {
    return NextResponse.json({ error: 'No content' }, { status: 400 });
  }

  const existing = await prisma.cardNote.findFirst({
    where: { cardId: params.id, userId }
  });

  const updated = existing
    ? await prisma.cardNote.update({
        where: { id: existing.id },
        data: { content: `${existing.content}\n\n${appendText}`.trim() }
      })
    : await prisma.cardNote.create({
        data: { cardId: params.id, userId, content: appendText.trim() }
      });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const existing = await prisma.cardNote.findFirst({
    where: { cardId: params.id, userId }
  });

  if (!existing) {
    return NextResponse.json({ error: 'No note found' }, { status: 404 });
  }

  await prisma.cardNote.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

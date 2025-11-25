import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { initializeFsrsStateForCard } from '@/lib/fsrsScheduler';
import { updateCardEmbedding } from '@/lib/embeddings';
import { revalidatePath } from 'next/cache';

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

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const body = await req.json();
    const { text, front, back, tags = [] } = body as {
      text?: string;
      front: string;
      back: string;
      tags?: string[];
    };

    if (!front || !back) {
      return NextResponse.json({ error: 'Front and back are required' }, { status: 400 });
    }

    const frontNormalized = ensureBlockMath(front);
    const backNormalized = ensureBlockMath(back);

    const source = await prisma.source.create({
      data: {
        userId,
        type: 'TEXT',
        rawText: text ?? front,
        markdown: text ?? front
      }
    });

    const card = await prisma.card.create({
      data: {
        userId,
        sourceId: source.id,
        front: frontNormalized,
        back: backNormalized,
        tags
      }
    });

    const updatedCard = await initializeFsrsStateForCard(card.id, card.createdAt);
    await updateCardEmbedding(card.id, userId, `${frontNormalized}\n\n${backNormalized}`);

    revalidatePath('/cards');
    revalidatePath('/dashboard');
    revalidatePath('/study');
    return NextResponse.json(updatedCard);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

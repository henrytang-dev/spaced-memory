import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { parseMathpixImage } from '@/lib/mathpix';
import { initializeFsrsStateForCard } from '@/lib/fsrsScheduler';
import { updateCardEmbedding } from '@/lib/embeddings';

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const providedFront = (formData.get('front') as string) || '';
    const providedBack = (formData.get('back') as string) || '';

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseMathpixImage(buffer);
    const latexBlock = parsed.latex ? `$$\n${parsed.latex}\n$$` : '';
    const markdownText = parsed.markdown || parsed.text || '';

    const front = providedFront || latexBlock || markdownText || parsed.text || '';
    const back = providedBack;

    const source = await prisma.source.create({
      data: {
        userId,
        type: 'IMAGE',
        rawText: parsed.text,
        latex: parsed.latex,
        markdown: parsed.markdown,
        imageUrl: null
      }
    });

    const card = await prisma.card.create({
      data: {
        userId,
        sourceId: source.id,
        front,
        back,
        tags: []
      }
    });

    const updatedCard = await initializeFsrsStateForCard(card.id, card.createdAt);
    await updateCardEmbedding(card.id, userId, `${front}\n\n${back}`);

    return NextResponse.json({
      card: updatedCard,
      ocr: { ...parsed, formattedFront: front }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

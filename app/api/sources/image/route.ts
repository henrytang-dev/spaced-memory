import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';
import { parseMathpixImage } from '@/lib/mathpix';
import { initializeFsrsStateForCard } from '@/lib/fsrsScheduler';
import { updateCardEmbedding } from '@/lib/embeddings';
import { revalidatePath } from 'next/cache';
import { addCardToPlaylist, ensureUnfiledPlaylist } from '@/lib/playlists';

function ensureBlockMath(text: string) {
  if (!text) return text;

  let normalized = text;

  // Convert display math delimiters \[...\] to $$...$$ (block)
  normalized = normalized.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) => `$$\n${inner}\n$$`);
  // Convert inline math delimiters \(...\) to $...$
  normalized = normalized.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner) => `$${inner}$`);

  const hasBlock = /\$\$/.test(normalized);
  const hasEnv = /\\begin\{[^}]+\}/.test(normalized);
  const hasInline = /(^|[^$])\$(?!\$)([^$]+?)\$(?!\$)/.test(normalized);

  // If we see an environment but no block delimiters, wrap the whole math block
  if (hasEnv && !hasBlock && !hasInline) {
    normalized = `$$\n${normalized}\n$$`;
  }

  return normalized;
}

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const formData = await req.formData();
    const file = formData.get('file') ?? formData.get('frontImage');
    const backFile = formData.get('backImage');
    const providedFront = (formData.get('front') as string) || '';
    const providedBack = (formData.get('back') as string) || '';
    const questionImageId = (formData.get('questionImageId') as string) || '';
    const answerImageId = (formData.get('answerImageId') as string) || '';

    // Allow two modes:
    // 1) Front image provided (file/frontImage)
    // 2) No front image, but front text is provided and (optionally) an answer image/back text
    if (!(file instanceof Blob) && !providedFront) {
      return NextResponse.json({ error: 'Provide a question image or question text' }, { status: 400 });
    }

    let parsedFront: any = null;
    let latexBlock = '';
    let markdownText = '';

    if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      parsedFront = await parseMathpixImage(buffer);
      latexBlock = parsedFront.latex ? ensureBlockMath(parsedFront.latex) : '';
      markdownText = ensureBlockMath(parsedFront.markdown || parsedFront.text || '');
    }

    let back = ensureBlockMath(providedBack);
    let parsedBack: any = null;
    if (backFile instanceof Blob) {
      const backBuffer = Buffer.from(await backFile.arrayBuffer());
      parsedBack = await parseMathpixImage(backBuffer);
      const backLatexBlock = parsedBack.latex ? ensureBlockMath(parsedBack.latex) : '';
      const backMarkdownText = ensureBlockMath(parsedBack.markdown || parsedBack.text || '');
      back = ensureBlockMath(providedBack || backLatexBlock || backMarkdownText || parsedBack.text || '');
    }

    let front = ensureBlockMath(providedFront || latexBlock || markdownText || parsedFront?.text || '');

    if (questionImageId) {
      front = `${front}\n\n![question image](/api/images/${questionImageId})`;
    }
    if (answerImageId) {
      back = `${back}\n\n![answer image](/api/images/${answerImageId})`;
    }

    const source = await prisma.source.create({
      data: {
        userId,
        type: 'IMAGE',
        rawText: parsedFront?.text || providedFront || null,
        latex: parsedFront?.latex || null,
        markdown: parsedFront?.markdown || providedFront || null,
        imageUrl: null,
        imageId: null
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

    const unfiled = await ensureUnfiledPlaylist(userId);
    await addCardToPlaylist(card.id, unfiled.id);

    const updatedCard = await initializeFsrsStateForCard(card.id, card.createdAt);
    await updateCardEmbedding(card.id, userId, `${front}\n\n${back}`);

    revalidatePath('/cards');
    revalidatePath('/dashboard');
    revalidatePath('/study');
    return NextResponse.json({
      card: updatedCard,
      ocr: { front: parsedFront, back: parsedBack, formattedFront: front, formattedBack: back }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}

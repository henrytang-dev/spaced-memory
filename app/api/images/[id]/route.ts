import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authSession';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  const image = await prisma.image.findFirst({
    where: { id: params.id, userId },
    select: { data: true, mimeType: true }
  });

  if (!image) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(image.data, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

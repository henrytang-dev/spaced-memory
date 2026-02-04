import { prisma } from './prisma';

export async function saveImage(opts: { userId: string; buffer: Buffer; mimeType: string }) {
  const { userId, buffer, mimeType } = opts;
  return prisma.image.create({
    data: {
      userId,
      mimeType,
      data: buffer,
      size: buffer.length
    }
  });
}

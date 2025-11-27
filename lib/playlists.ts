import { prisma } from './prisma';

export async function ensureUnfiledPlaylist(userId: string) {
  const existing = await prisma.playlist.findFirst({
    where: { userId, name: 'Unfiled' }
  });
  if (existing) return existing;
  return prisma.playlist.create({
    data: {
      userId,
      name: 'Unfiled',
      description: 'Default bucket'
    }
  });
}

export async function addCardToPlaylist(cardId: string, playlistId: string) {
  await prisma.playlistCard.upsert({
    where: { playlistId_cardId: { playlistId, cardId } },
    update: {},
    create: { playlistId, cardId }
  });
}

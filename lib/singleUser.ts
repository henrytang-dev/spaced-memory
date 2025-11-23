import { prisma } from './prisma';

const SINGLE_USER_ID = 'single-user';
const DEFAULT_EMAIL = 'owner@spaced.local';

export async function getSingleUserId() {
  const email = process.env.APP_USER_EMAIL || DEFAULT_EMAIL;
  await prisma.user.upsert({
    where: { id: SINGLE_USER_ID },
    update: { email },
    create: {
      id: SINGLE_USER_ID,
      email,
      passwordHash: 'placeholder'
    }
  });
  return SINGLE_USER_ID;
}

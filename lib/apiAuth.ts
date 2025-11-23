import { NextResponse } from 'next/server';
import { getAuthSession } from './auth';

export async function requireUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { userId: null as string | null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { userId: session.user.id, response: null };
}

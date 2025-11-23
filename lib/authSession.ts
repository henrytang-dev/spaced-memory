import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSingleUserId } from './singleUser';

export const AUTH_COOKIE_NAME = 'spaced_auth';

function ensurePassword(): string {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    throw new Error('APP_PASSWORD is not set');
  }
  return password;
}

function expectedToken() {
  return crypto.createHash('sha256').update(ensurePassword()).digest('hex');
}

export function isAuthenticated() {
  const cookie = cookies().get(AUTH_COOKIE_NAME);
  if (!cookie) return false;
  try {
    return cookie.value === expectedToken();
  } catch {
    return false;
  }
}

export async function requireUser() {
  if (!isAuthenticated()) {
    return { userId: null as string | null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const userId = await getSingleUserId();
  return { userId, response: null };
}

export function createSessionCookieValue() {
  return expectedToken();
}

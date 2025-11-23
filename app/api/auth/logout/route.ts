import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/authSession';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/'
  });
  return res;
}

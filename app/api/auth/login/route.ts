import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, createSessionCookieValue } from '@/lib/authSession';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }
    const expected = process.env.APP_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: 'APP_PASSWORD is not configured' }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: createSessionCookieValue(),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Unable to login' }, { status: 500 });
  }
}

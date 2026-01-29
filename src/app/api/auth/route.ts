import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'demo123';
const COOKIE_NAME = 'cinematic_auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === AUTH_PASSWORD) {
      // Create a simple token (in production, use proper JWT)
      const token = Buffer.from(`authenticated:${Date.now()}`).toString('base64');
      
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}

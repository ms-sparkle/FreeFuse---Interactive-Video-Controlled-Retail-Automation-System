import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED = ['/check-in', '/player-dashboard', '/coach'];
const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/check-in/:path*', '/player-dashboard/:path*', '/coach/:path*'],
};

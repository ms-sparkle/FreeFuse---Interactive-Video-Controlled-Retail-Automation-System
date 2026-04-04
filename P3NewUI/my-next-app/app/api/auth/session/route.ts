import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

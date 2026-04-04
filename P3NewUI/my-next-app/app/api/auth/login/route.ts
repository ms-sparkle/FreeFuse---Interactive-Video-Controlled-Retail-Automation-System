import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = getDb();

    const account = db.prepare(
      'SELECT AccountID, PasswordHash FROM ACCOUNT WHERE Username = ?'
    ).get(username) as { AccountID: number; PasswordHash: string } | undefined;

    if (!account) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, account.PasswordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const person = db.prepare(
      'SELECT PersonID, FirstName, LastName FROM PERSON WHERE AccountID = ?'
    ).get(account.AccountID) as { PersonID: number; FirstName: string; LastName: string } | undefined;

    if (!person) {
      return NextResponse.json({ error: 'Person record not found' }, { status: 404 });
    }

    const isCoach = db.prepare('SELECT 1 FROM COACH WHERE PersonID = ?').get(person.PersonID);
    const athlete = db.prepare('SELECT Sex FROM ATHLETE WHERE PersonID = ?').get(person.PersonID) as { Sex: string } | undefined;

    const role = isCoach ? 'coach' : athlete ? 'athlete' : null;

    if (!role) {
      return NextResponse.json({ error: 'No role assigned' }, { status: 403 });
    }

    const payload = {
      personId: person.PersonID,
      firstName: person.FirstName,
      lastName: person.LastName,
      role,
      sex: athlete?.Sex ?? null,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(secret);

    const response = NextResponse.json({ ok: true, role });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

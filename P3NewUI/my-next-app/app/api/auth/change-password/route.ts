import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const personId = payload.personId as number;

    const { currentPassword, newPassword } = await req.json() as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();

    const account = db.prepare(
      'SELECT acc.AccountID, acc.PasswordHash FROM ACCOUNT acc JOIN PERSON p ON p.AccountID = acc.AccountID WHERE p.PersonID = ?'
    ).get(personId) as { AccountID: number; PasswordHash: string } | undefined;

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, account.PasswordHash);
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE ACCOUNT SET PasswordHash = ? WHERE AccountID = ?').run(newHash, account.AccountID);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

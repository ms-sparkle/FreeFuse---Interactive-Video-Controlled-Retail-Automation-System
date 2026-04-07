import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, firstName, lastName, dob } = await req.json() as {
      username: string;
      password: string;
      role: string;
      firstName: string;
      lastName: string;
      dob?: string;
    };

    if (!username || !password || !role || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (role !== 'athlete' && role !== 'coach') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT 1 FROM ACCOUNT WHERE Username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const accountResult = db.prepare(
      'INSERT INTO ACCOUNT (Username, PasswordHash) VALUES (?, ?)'
    ).run(username, passwordHash);

    const accountId = accountResult.lastInsertRowid as number;

    const personResult = db.prepare(
      'INSERT INTO PERSON (FirstName, LastName, DateOfBirth, AccountID) VALUES (?, ?, ?, ?)'
    ).run(firstName, lastName, dob ?? null, accountId);

    const personId = personResult.lastInsertRowid as number;

    if (role === 'athlete') {
      db.prepare(
        'INSERT INTO ATHLETE (PersonID, HoursSpentWorkingOut, SportPlayed, Team, Sex, Height, Weight) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(personId, 0, '', '', 'Other', 0, 0);
    } else {
      db.prepare('INSERT INTO COACH (PersonID) VALUES (?)').run(personId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

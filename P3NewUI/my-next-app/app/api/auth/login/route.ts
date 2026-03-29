import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = getDb();

    // Validate credentials (passwords stored as plain text in seed data)
    const account = db.prepare(
      'SELECT AccountID FROM ACCOUNT WHERE Username = ? AND PasswordHash = ?'
    ).get(username, password) as { AccountID: number } | undefined;

    if (!account) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get person details
    const person = db.prepare(
      'SELECT PersonID, FirstName, LastName FROM PERSON WHERE AccountID = ?'
    ).get(account.AccountID) as { PersonID: number; FirstName: string; LastName: string } | undefined;

    if (!person) {
      return NextResponse.json({ error: 'Person record not found' }, { status: 404 });
    }

    // Determine role
    const isCoach = db.prepare('SELECT 1 FROM COACH WHERE PersonID = ?').get(person.PersonID);
    const isAthlete = db.prepare('SELECT 1 FROM ATHLETE WHERE PersonID = ?').get(person.PersonID);

    const role = isCoach ? 'coach' : isAthlete ? 'athlete' : null;

    if (!role) {
      return NextResponse.json({ error: 'No role assigned' }, { status: 403 });
    }

    return NextResponse.json({
      personId: person.PersonID,
      firstName: person.FirstName,
      lastName: person.LastName,
      role,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

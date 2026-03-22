import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface Account {
  AccountID: number;
  Username: string;
  PasswordHash: string;
}

interface Person {
  PersonID: number;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  AccountID: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  const db = getDb();

  const account = db
    .prepare('SELECT * FROM ACCOUNT WHERE Username = ? AND PasswordHash = ?')
    .get(username, password) as Account | undefined;

  if (!account) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const person = db
    .prepare('SELECT * FROM PERSON WHERE AccountID = ?')
    .get(account.AccountID) as Person | undefined;

  if (!person) {
    return NextResponse.json({ error: 'No person record for this account' }, { status: 500 });
  }

  const isCoach = !!db
    .prepare('SELECT 1 FROM COACH WHERE PersonID = ?')
    .get(person.PersonID);

  const isAthlete = !!db
    .prepare('SELECT 1 FROM ATHLETE WHERE PersonID = ?')
    .get(person.PersonID);

  const role = isCoach ? 'coach' : isAthlete ? 'athlete' : 'unknown';

  return NextResponse.json({
    personId: person.PersonID,
    firstName: person.FirstName,
    lastName: person.LastName,
    role,
  });
}

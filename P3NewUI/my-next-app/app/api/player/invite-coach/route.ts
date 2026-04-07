import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import getDb from '@/lib/db';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const athleteId = payload.personId as number;

    const { username } = await req.json() as { username: string };
    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    const db = getDb();

    // Find the coach by username
    const row = db.prepare(`
      SELECT p.PersonID, p.FirstName, p.LastName
      FROM ACCOUNT acc
      JOIN PERSON p ON p.AccountID = acc.AccountID
      JOIN COACH c ON c.PersonID = p.PersonID
      WHERE acc.Username = ?
    `).get(username) as { PersonID: number; FirstName: string; LastName: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Coach not found. Make sure the username is correct.' }, { status: 404 });
    }

    // Check if already linked
    const existing = db.prepare(
      'SELECT 1 FROM ATHLETE_COACH WHERE AthletePersonID = ? AND CoachPersonID = ?'
    ).get(athleteId, row.PersonID);

    if (existing) {
      return NextResponse.json({ error: 'This coach is already on your roster' }, { status: 409 });
    }

    db.prepare(
      'INSERT INTO ATHLETE_COACH (AthletePersonID, CoachPersonID) VALUES (?, ?)'
    ).run(athleteId, row.PersonID);

    return NextResponse.json({ success: true, coachName: `${row.FirstName} ${row.LastName}` });
  } catch (err) {
    console.error('Invite coach error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

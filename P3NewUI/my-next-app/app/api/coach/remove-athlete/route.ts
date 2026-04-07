import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import getDb from '@/lib/db';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const coachId = payload.personId as number;

    const { athleteId } = await req.json() as { athleteId: number };
    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      'DELETE FROM ATHLETE_COACH WHERE AthletePersonID = ? AND CoachPersonID = ?'
    ).run(athleteId, coachId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove athlete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

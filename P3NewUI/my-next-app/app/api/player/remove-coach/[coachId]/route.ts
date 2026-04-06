import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import getDb from '@/lib/db';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const token = req.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const athleteId = payload.personId as number;

    const { coachId: coachIdStr } = await params;
    const coachId = Number(coachIdStr);
    if (isNaN(coachId)) {
      return NextResponse.json({ error: 'Invalid coachId' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      'DELETE FROM ATHLETE_COACH WHERE AthletePersonID = ? AND CoachPersonID = ?'
    ).run(athleteId, coachId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove coach error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

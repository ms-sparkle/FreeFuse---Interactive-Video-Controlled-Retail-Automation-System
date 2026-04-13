import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = Number(id);

    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    const db = getDb();

    const sessions = db.prepare(`
      SELECT ws.SessionDate, w.WorkoutName, w.Duration, ws.Notes
      FROM WORKOUT_SESSION ws
      JOIN WORKOUT w ON w.WorkoutID = ws.WorkoutID
      WHERE ws.AthletePersonID = ?
      ORDER BY ws.SessionDate ASC
    `).all(personId) as {
      SessionDate: string;
      WorkoutName: string;
      Duration: number;
      Notes: string;
    }[];

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('Session history error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

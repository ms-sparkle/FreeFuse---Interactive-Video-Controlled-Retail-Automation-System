import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { athleteId, workoutId, notes } = body as {
    athleteId?: number;
    workoutId?: number;
    notes?: string;
  };

  if (!athleteId || !workoutId) {
    return NextResponse.json({ error: 'athleteId and workoutId required' }, { status: 400 });
  }

  const db = getDb();

  const result = db
    .prepare(
      'INSERT INTO WORKOUT_SESSION (AthletePersonID, WorkoutID, Notes) VALUES (?, ?, ?)'
    )
    .run(Number(athleteId), Number(workoutId), notes ?? null);

  return NextResponse.json({ success: true, sessionId: result.lastInsertRowid });
}

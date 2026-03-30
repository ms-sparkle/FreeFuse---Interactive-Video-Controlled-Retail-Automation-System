import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// POST /api/workout-session
// Body: { athletePersonId: number, workoutName: string, notes?: string }
export async function POST(req: NextRequest) {
  try {
    const { athletePersonId, workoutName, notes } = await req.json() as {
      athletePersonId: number;
      workoutName: string;
      notes?: string;
    };

    if (!athletePersonId || !workoutName) {
      return NextResponse.json({ error: 'athletePersonId and workoutName required' }, { status: 400 });
    }

    const db = getDb();

    const workout = db.prepare('SELECT WorkoutID FROM WORKOUT WHERE WorkoutName = ?').get(workoutName) as
      | { WorkoutID: number }
      | undefined;

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const result = db.prepare(`
      INSERT INTO WORKOUT_SESSION (SessionDate, AthletePersonID, WorkoutID, Notes)
      VALUES (date('now'), ?, ?, ?)
    `).run(athletePersonId, workout.WorkoutID, notes ?? null);

    return NextResponse.json({ ok: true, sessionId: result.lastInsertRowid });
  } catch (err) {
    console.error('Workout session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

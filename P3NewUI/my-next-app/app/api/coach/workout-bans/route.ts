// app/api/coach/workout-bans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

function ensureTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS "WORKOUT_BAN" (
      "BanID"           INTEGER,
      "AthletePersonID" INTEGER NOT NULL,
      "CoachPersonID"   INTEGER NOT NULL,
      "WorkoutID"       INTEGER,
      "WorkoutName"     TEXT,
      "MuscleGroup"     TEXT,
      "BanType"         TEXT NOT NULL CHECK("BanType" IN ('workout', 'muscle')),
      "ExpirationDate"  DATE,
      "CreatedDate"     DATE DEFAULT CURRENT_DATE,
      PRIMARY KEY("BanID" AUTOINCREMENT),
      FOREIGN KEY("AthletePersonID") REFERENCES "ATHLETE"("PersonID"),
      FOREIGN KEY("CoachPersonID")   REFERENCES "COACH"("PersonID"),
      FOREIGN KEY("WorkoutID")       REFERENCES "WORKOUT"("WorkoutID")
    )
  `);
  // Migration: add WorkoutName column to existing tables that predate this column
  const cols = db.pragma('table_info(WORKOUT_BAN)') as { name: string }[];
  if (!cols.some(c => c.name === 'WorkoutName')) {
    db.exec('ALTER TABLE "WORKOUT_BAN" ADD COLUMN "WorkoutName" TEXT');
  }
  return db;
}

// GET /api/coach/workout-bans?athleteId=3
// Returns all active bans for an athlete (expired bans are excluded)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get('athleteId');

  if (!athleteId) {
    return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
  }

  const db = ensureTable();

  const bans = db.prepare(`
    SELECT
      wb.BanID,
      wb.BanType,
      wb.WorkoutID,
      wb.WorkoutName,
      wb.MuscleGroup,
      wb.ExpirationDate,
      wb.CreatedDate,
      p.FirstName || ' ' || p.LastName AS CoachName
    FROM WORKOUT_BAN wb
    JOIN PERSON p ON p.PersonID = wb.CoachPersonID
    WHERE wb.AthletePersonID = ?
      AND (wb.ExpirationDate IS NULL OR wb.ExpirationDate >= date('now'))
    ORDER BY wb.CreatedDate DESC
  `).all(Number(athleteId)) as {
    BanID: number;
    BanType: 'workout' | 'muscle';
    WorkoutID: number | null;
    MuscleGroup: string | null;
    ExpirationDate: string | null;
    CreatedDate: string;
    WorkoutName: string | null;
    CoachName: string;
  }[];

  return NextResponse.json({ bans });
}

// POST /api/coach/workout-bans
// Body: { athleteId, coachId, banType, workoutId?, muscleGroup?, expirationDate? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      athleteId?: number;
      coachId?: number;
      banType?: 'workout' | 'muscle';
      workoutId?: number | null;
      workoutName?: string | null;
      muscleGroup?: string | null;
      expirationDate?: string | null;
    };

    const { athleteId, coachId, banType, workoutId, workoutName, muscleGroup, expirationDate } = body;

    if (!athleteId || !coachId || !banType) {
      return NextResponse.json({ error: 'athleteId, coachId, and banType are required' }, { status: 400 });
    }

    if (banType === 'workout' && !workoutId) {
      return NextResponse.json({ error: 'workoutId is required for workout bans' }, { status: 400 });
    }

    if (banType === 'muscle' && !muscleGroup) {
      return NextResponse.json({ error: 'muscleGroup is required for muscle bans' }, { status: 400 });
    }

    const db = ensureTable();

    // Check for duplicate active ban
    const existing = db.prepare(`
      SELECT BanID FROM WORKOUT_BAN
      WHERE AthletePersonID = ?
        AND BanType = ?
        AND (WorkoutID = ? OR MuscleGroup = ?)
        AND (ExpirationDate IS NULL OR ExpirationDate >= date('now'))
    `).get(athleteId, banType, workoutId ?? null, muscleGroup ?? null);

    if (existing) {
      return NextResponse.json({ error: 'An active ban already exists for this workout/muscle group' }, { status: 409 });
    }

    const result = db.prepare(`
      INSERT INTO WORKOUT_BAN
        (AthletePersonID, CoachPersonID, WorkoutID, WorkoutName, MuscleGroup, BanType, ExpirationDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      athleteId,
      coachId,
      workoutId ?? null,
      workoutName ?? null,
      muscleGroup ?? null,
      banType,
      expirationDate ?? null
    );

    const ban = db.prepare(`
      SELECT wb.BanID, wb.BanType, wb.WorkoutID, wb.WorkoutName, wb.MuscleGroup,
             wb.ExpirationDate, wb.CreatedDate,
             p.FirstName || ' ' || p.LastName AS CoachName
      FROM WORKOUT_BAN wb
      JOIN PERSON p ON p.PersonID = wb.CoachPersonID
      WHERE wb.BanID = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ban });
  } catch (err) {
    console.error('workout-bans POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/coach/workout-bans
// Body: { banId }
export async function DELETE(req: NextRequest) {
  const { banId } = await req.json() as { banId?: number };

  if (!banId) {
    return NextResponse.json({ error: 'banId is required' }, { status: 400 });
  }

  const db = ensureTable();

  const existing = db.prepare('SELECT BanID FROM WORKOUT_BAN WHERE BanID = ?').get(banId);
  if (!existing) {
    return NextResponse.json({ error: 'Ban not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM WORKOUT_BAN WHERE BanID = ?').run(banId);
  return NextResponse.json({ ok: true });
}
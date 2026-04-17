import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
 
type RequestBody = {
  athleteId?: number;
  workoutName?: string;
  primaryNodes?: string[];
  secondaryNodes?: string[];
};
 
export async function POST(req: NextRequest) {
  const body = await req.json() as RequestBody;
  const { athleteId, workoutName, primaryNodes = [], secondaryNodes = [] } = body;
 
  if (!athleteId || !workoutName) {
    return NextResponse.json(
      { error: 'athleteId and workoutName are required' },
      { status: 400 }
    );
  }
 
  const db = getDb();
 
  // ── 1. Check for active workout-name bans ──────────────────────────────────
  const workoutBan = db.prepare(`
    SELECT BanID, WorkoutName, ExpirationDate
    FROM WORKOUT_BAN
    WHERE AthletePersonID = ?
      AND BanType = 'workout'
      AND WorkoutName = ?
      AND (ExpirationDate IS NULL OR ExpirationDate >= date('now'))
  `).get(athleteId, workoutName) as {
    BanID: number;
    WorkoutName: string;
    ExpirationDate: string | null;
  } | undefined;
 
  if (workoutBan) {
    const expiry = workoutBan.ExpirationDate
      ? ` (ban expires ${workoutBan.ExpirationDate})`
      : ' (no expiration)';
    return NextResponse.json(
      {
        error: `"${workoutBan.WorkoutName}" is banned for this athlete${expiry}.`,
        banType: 'workout',
      },
      { status: 409 }
    );
  }
 
  // ── 2. Check for active muscle-group bans ──────────────────────────────────
  const allNodes = [...primaryNodes, ...secondaryNodes];
 
  const muscleBans = db.prepare(`
    SELECT BanID, MuscleGroup, ExpirationDate
    FROM WORKOUT_BAN
    WHERE AthletePersonID = ?
      AND BanType = 'muscle'
      AND (ExpirationDate IS NULL OR ExpirationDate >= date('now'))
  `).all(athleteId) as {
    BanID: number;
    MuscleGroup: string;
    ExpirationDate: string | null;
  }[];
 
  for (const ban of muscleBans) {
    if (allNodes.includes(ban.MuscleGroup)) {
      const expiry = ban.ExpirationDate
        ? ` (ban expires ${ban.ExpirationDate})`
        : ' (no expiration)';
      return NextResponse.json(
        {
          error: `Workouts targeting "${ban.MuscleGroup}" are banned for this athlete${expiry}.`,
          banType: 'muscle',
        },
        { status: 409 }
      );
    }
  }
 
  // ── 3. No bans — find or create a WORKOUT row to reference ─────────────────
  // WORKOUT_SESSION requires a WorkoutID FK. Look up by name first; if not
  // found in the DB workouts table, we insert a placeholder row so the FK is
  // satisfied without breaking the schema.
  let workoutRow = db.prepare(
    `SELECT WorkoutID FROM WORKOUT WHERE WorkoutName = ? LIMIT 1`
  ).get(workoutName) as { WorkoutID: number } | undefined;
 
  if (!workoutRow) {
    // Insert a minimal placeholder (BodyPartID nullable via LEFT JOIN design,
    // but the schema requires it — use NULL-safe insert with no BodyPartID).
    // If your schema requires BodyPartID NOT NULL, omit this block and only
    // allow DB workouts; for the JSON workout list this is the right approach.
    const ins = db.prepare(`
      INSERT INTO WORKOUT (WorkoutName, BodyPartID, Duration, Reps)
      VALUES (?, NULL, NULL, NULL)
    `).run(workoutName);
    workoutRow = { WorkoutID: Number(ins.lastInsertRowid) };
  }
 
  // ── 4. Insert into WORKOUT_SESSION ────────────────────────────────────────
  const result = db.prepare(`
    INSERT INTO WORKOUT_SESSION (SessionDate, AthletePersonID, WorkoutID, Notes)
    VALUES (date('now'), ?, ?, ?)
  `).run(athleteId, workoutRow.WorkoutID, `Added to training plan by coach`);
 
  return NextResponse.json({
    ok: true,
    sessionId: result.lastInsertRowid,
    workoutName,
  });
}
 
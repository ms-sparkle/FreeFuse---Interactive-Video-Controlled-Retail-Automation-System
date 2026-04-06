import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const athleteId = Number(searchParams.get('athleteId'));

    if (!athleteId) {
      return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
    }

    const db = getDb();

    // =========================
    // 1. GET LATEST SORENESS
    // =========================
    const soreness = db.prepare(`
      SELECT BodyPartName, SorenessLevel
      FROM SORENESS
      WHERE AthletePersonID = ?
    `).all(athleteId) as any[];

    const highSoreness = soreness
      .filter(s => s.SorenessLevel >= 7)
      .map(s => s.BodyPartName);

    const moderateSoreness = soreness
      .filter(s => s.SorenessLevel >= 4 && s.SorenessLevel < 7)
      .map(s => s.BodyPartName);

    // =========================
    // 2. GET RECENT WORKOUTS
    // =========================
    const recent = db.prepare(`
      SELECT w.BodyPartName
      FROM WORKOUT_SESSION ws
      JOIN WORKOUT w ON w.WorkoutID = ws.WorkoutID
      WHERE ws.AthletePersonID = ?
      ORDER BY ws.SessionDate DESC
      LIMIT 5
    `).all(athleteId) as any[];

    const recentMuscles = recent.map(r => r.BodyPartName);

    // =========================
    // 3. GET ALL WORKOUTS
    // =========================
    let workouts = db.prepare(`
      SELECT WorkoutID, WorkoutName, BodyPartName
      FROM WORKOUT
    `).all() as any[];

    // =========================
    // 4. APPLY "AI LOGIC"
    // =========================

    workouts = workouts.filter(w => {
      // Avoid high soreness
      if (highSoreness.includes(w.BodyPartName)) return false;

      // ⚠️ Avoid repeating same muscle too soon
      if (recentMuscles.slice(0, 2).includes(w.BodyPartName)) return false;

      return true;
    });

    // PRIORITIZE GOOD MUSCLES
    workouts.sort((a, b) => {
      const aScore = moderateSoreness.includes(a.BodyPartName) ? 1 : 0;
      const bScore = moderateSoreness.includes(b.BodyPartName) ? 1 : 0;
      return aScore - bScore;
    });

    // Limit results
    const recommendations = workouts.slice(0, 6);

    return NextResponse.json({ recommendations });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
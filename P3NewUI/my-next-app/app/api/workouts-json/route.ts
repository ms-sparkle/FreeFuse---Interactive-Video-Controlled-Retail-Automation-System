import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const exercises = db.prepare(`
    SELECT w.WorkoutID, w.WorkoutName, bp.BodyPartName
    FROM WORKOUT w
    LEFT JOIN BODYPART bp ON bp.BodyPartID = w.BodyPartID
    ORDER BY w.WorkoutName
  `).all() as { WorkoutID: number; WorkoutName: string; BodyPartName: string }[];
  return NextResponse.json({ exercises });
}
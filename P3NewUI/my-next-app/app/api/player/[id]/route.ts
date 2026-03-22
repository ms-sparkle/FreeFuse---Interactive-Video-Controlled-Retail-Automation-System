import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const personId = Number(id);
  if (isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = getDb();

  const person = db
    .prepare(
      `SELECT p.PersonID, p.FirstName, p.LastName, p.DateOfBirth,
              a.SportPlayed, a.Team, a.HoursSpentWorkingOut
       FROM PERSON p
       JOIN ATHLETE a ON p.PersonID = a.PersonID
       WHERE p.PersonID = ?`
    )
    .get(personId);

  if (!person) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  const latestReport = db
    .prepare(
      `SELECT * FROM SORENESS_REPORT
       WHERE AthletePersonID = ?
       ORDER BY ReportDate DESC, ReportID DESC
       LIMIT 1`
    )
    .get(personId) as { ReportID: number; InjuryRiskScore: number; ProgressScore: number; ReportDate: string } | undefined;

  const sorenessEntries = latestReport
    ? db
        .prepare(
          `SELECT se.SorenessLevel, bp.BodyPartName, bp.Side
           FROM SORENESS_ENTRY se
           JOIN BODYPART bp ON se.BodyPartID = bp.BodyPartID
           WHERE se.ReportID = ?`
        )
        .all(latestReport.ReportID)
    : [];

  const recentSessions = db
    .prepare(
      `SELECT ws.SessionID, ws.SessionDate, ws.Notes,
              w.WorkoutName, w.Duration, w.Reps,
              bp.BodyPartName
       FROM WORKOUT_SESSION ws
       JOIN WORKOUT w ON ws.WorkoutID = w.WorkoutID
       LEFT JOIN BODYPART bp ON w.BodyPartID = bp.BodyPartID
       WHERE ws.AthletePersonID = ?
       ORDER BY ws.SessionDate DESC
       LIMIT 10`
    )
    .all(personId);

  return NextResponse.json({ person, latestReport: latestReport ?? null, sorenessEntries, recentSessions });
}

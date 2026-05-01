import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = Number(id);

    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    const body = await req.json() as {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      sex: string;
      height: number;
      weight: number;
      sportPlayed: string;
      team: string;
      hoursSpentWorkingOut: number;
    };

    const db = getDb();

    db.prepare(`
      UPDATE PERSON SET FirstName = ?, LastName = ?, DateOfBirth = ?
      WHERE PersonID = ?
    `).run(body.firstName, body.lastName, body.dateOfBirth, personId);

    db.prepare(`
      UPDATE ATHLETE SET Sex = ?, Height = ?, Weight = ?, SportPlayed = ?, Team = ?, HoursSpentWorkingOut = ?
      WHERE PersonID = ?
    `).run(body.sex, body.height, body.weight, body.sportPlayed, body.team, body.hoursSpentWorkingOut, personId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Player update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Migration: add SelectedPreset column to ATHLETE if not yet present
    const cols = db.pragma('table_info(ATHLETE)') as { name: string }[];
    if (!cols.some(c => c.name === 'SelectedPreset')) {
      db.exec('ALTER TABLE "ATHLETE" ADD COLUMN "SelectedPreset" TEXT');
    }

    // Person + athlete info
    const player = db.prepare(`
      SELECT
        p.PersonID,
        p.FirstName,
        p.LastName,
        p.DateOfBirth,
        a.SportPlayed,
        a.Team,
        a.Sex,
        a.Height,
        a.Weight,
        a.HoursSpentWorkingOut,
        a.SelectedPreset
      FROM PERSON p
      JOIN ATHLETE a ON a.PersonID = p.PersonID
      WHERE p.PersonID = ?
    `).get(personId) as {
      PersonID: number;
      FirstName: string;
      LastName: string;
      DateOfBirth: string;
      SportPlayed: string;
      Team: string;
      Sex: string;
      Height: number;
      Weight: number;
      HoursSpentWorkingOut: number;
    } | undefined;

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Latest soreness report that has at least one entry
    const latestReport = db.prepare(`
      SELECT sr.ReportID, sr.ReportDate, sr.ProgressScore, sr.InjuryRiskScore
      FROM SORENESS_REPORT sr
      WHERE sr.AthletePersonID = ?
        AND EXISTS (SELECT 1 FROM SORENESS_ENTRY se WHERE se.ReportID = sr.ReportID)
      ORDER BY sr.ReportDate DESC, sr.ReportID DESC
      LIMIT 1
    `).get(personId) as {
      ReportID: number;
      ReportDate: string;
      ProgressScore: number;
      InjuryRiskScore: number;
    } | undefined;

    // Soreness entries for the latest report
    const sorenessEntries = latestReport
      ? (db.prepare(`
          SELECT se.BodyPartID, se.SorenessLevel, bp.BodyPartName, bp.Side
          FROM SORENESS_ENTRY se
          JOIN BODYPART bp ON bp.BodyPartID = se.BodyPartID
          WHERE se.ReportID = ?
        `).all(latestReport.ReportID) as {
          BodyPartID: number;
          SorenessLevel: number;
          BodyPartName: string;
          Side: string;
        }[])
      : [];

    // Workout suggestions based on sore body parts
    const workoutSuggestions = sorenessEntries.length > 0
      ? (db.prepare(`
          SELECT DISTINCT w.WorkoutName, w.Duration, w.Reps, bp.BodyPartName
          FROM WORKOUT w
          JOIN BODYPART bp ON bp.BodyPartID = w.BodyPartID
          WHERE w.BodyPartID NOT IN (
            SELECT se.BodyPartID FROM SORENESS_ENTRY se
            JOIN SORENESS_REPORT sr ON sr.ReportID = se.ReportID
            WHERE sr.AthletePersonID = ? AND se.SorenessLevel >= 5
          )
          LIMIT 3
        `).all(personId) as {
          WorkoutName: string;
          Duration: number;
          Reps: number;
          BodyPartName: string;
        }[])
      : (db.prepare(`
          SELECT w.WorkoutName, w.Duration, w.Reps, bp.BodyPartName
          FROM WORKOUT w
          JOIN BODYPART bp ON bp.BodyPartID = w.BodyPartID
          LIMIT 3
        `).all() as {
          WorkoutName: string;
          Duration: number;
          Reps: number;
          BodyPartName: string;
        }[]);

    // Recent workout sessions (last 7)
    const sessions = db.prepare(`
      SELECT ws.SessionDate, w.WorkoutName, w.Duration, ws.Notes
      FROM WORKOUT_SESSION ws
      JOIN WORKOUT w ON w.WorkoutID = ws.WorkoutID
      WHERE ws.AthletePersonID = ?
      ORDER BY ws.SessionDate DESC
      LIMIT 7
    `).all(personId) as {
      SessionDate: string;
      WorkoutName: string;
      Duration: number;
      Notes: string;
    }[];

    // Fetch coaches linked to this athlete
    const coaches = db.prepare(`
      SELECT 
        p.PersonID, 
        p.FirstName, 
        p.LastName, 
        acc.Username AS Email
      FROM ATHLETE_COACH ac
      JOIN PERSON p ON ac.CoachPersonID = p.PersonID
      JOIN ACCOUNT acc ON p.AccountID = acc.AccountID
      WHERE ac.AthletePersonID = ?
    `).all(personId) as {
      PersonID: number;
      FirstName: string;
      LastName: string;
      Email: string;
    }[];

    return NextResponse.json({
      player,
      coaches,
      latestReport: latestReport ?? null,
      sorenessEntries,
      workoutSuggestions,
      sessions,
      selectedPreset: (player as { SelectedPreset?: string | null }).SelectedPreset ?? null,
    });
  } catch (err) {
    console.error('Player fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

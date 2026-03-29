import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const db = getDb();

    const athletes = db.prepare(`
      SELECT
        p.PersonID,
        p.FirstName,
        p.LastName,
        a.SportPlayed,
        a.Team,
        a.Sex,
        a.Height,
        a.Weight,
        a.HoursSpentWorkingOut,
        -- Latest soreness report scores
        sr.ProgressScore,
        sr.InjuryRiskScore,
        sr.ReportDate
      FROM ATHLETE_COACH ac
      JOIN PERSON p ON p.PersonID = ac.AthletePersonID
      JOIN ATHLETE a ON a.PersonID = ac.AthletePersonID
      LEFT JOIN SORENESS_REPORT sr ON sr.ReportID = (
        SELECT ReportID FROM SORENESS_REPORT
        WHERE AthletePersonID = ac.AthletePersonID
        ORDER BY ReportDate DESC
        LIMIT 1
      )
      WHERE ac.CoachPersonID = ?
      ORDER BY p.LastName, p.FirstName
    `).all(Number(coachId)) as {
      PersonID: number;
      FirstName: string;
      LastName: string;
      SportPlayed: string;
      Team: string;
      Sex: string;
      Height: number;
      Weight: number;
      HoursSpentWorkingOut: number;
      ProgressScore: number | null;
      InjuryRiskScore: number | null;
      ReportDate: string | null;
    }[];

    return NextResponse.json({ athletes });
  } catch (err) {
    console.error('Coach athletes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

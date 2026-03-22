import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const coachId = req.nextUrl.searchParams.get('coachId');

  if (!coachId || isNaN(Number(coachId))) {
    return NextResponse.json({ error: 'Valid coachId query param required' }, { status: 400 });
  }

  const db = getDb();

  const athletes = db
    .prepare(
      `SELECT
        p.PersonID, p.FirstName, p.LastName,
        a.SportPlayed, a.Team, a.HoursSpentWorkingOut,
        sr.InjuryRiskScore, sr.ProgressScore, sr.ReportDate
       FROM ATHLETE_COACH ac
       JOIN ATHLETE a ON ac.AthletePersonID = a.PersonID
       JOIN PERSON p ON a.PersonID = p.PersonID
       LEFT JOIN SORENESS_REPORT sr ON sr.AthletePersonID = a.PersonID
         AND sr.ReportDate = (
           SELECT MAX(sr2.ReportDate)
           FROM SORENESS_REPORT sr2
           WHERE sr2.AthletePersonID = a.PersonID
         )
       WHERE ac.CoachPersonID = ?`
    )
    .all(Number(coachId));

  return NextResponse.json(athletes);
}

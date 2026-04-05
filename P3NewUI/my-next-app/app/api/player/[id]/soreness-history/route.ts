import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

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

    // Fetch soreness entries across all reports for this athlete (last 30 days)
    const rows = db.prepare(`
      SELECT
        sr.ReportDate,
        bp.BodyPartName,
        bp.Side,
        se.SorenessLevel
      FROM SORENESS_ENTRY se
      JOIN SORENESS_REPORT sr ON sr.ReportID = se.ReportID
      JOIN BODYPART bp ON bp.BodyPartID = se.BodyPartID
      WHERE sr.AthletePersonID = ?
        AND sr.ReportDate >= date('now', '-30 days')
      ORDER BY sr.ReportDate ASC
    `).all(personId) as {
      ReportDate: string;
      BodyPartName: string;
      Side: string;
      SorenessLevel: number;
    }[];

    return NextResponse.json({ history: rows });
  } catch (err) {
    console.error('Soreness history error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

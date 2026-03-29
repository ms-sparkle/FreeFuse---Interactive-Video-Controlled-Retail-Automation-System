import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// POST /api/check-in
// Body: { athletePersonId: number, sorenessData: { [muscleSlug: string]: number } }
export async function POST(req: NextRequest) {
  try {
    const { athletePersonId, sorenessData } = await req.json() as {
      athletePersonId: number;
      sorenessData: Record<string, number>;
    };

    if (!athletePersonId || !sorenessData) {
      return NextResponse.json({ error: 'athletePersonId and sorenessData required' }, { status: 400 });
    }

    const db = getDb();

    // Verify the athlete exists
    const athlete = db.prepare('SELECT 1 FROM ATHLETE WHERE PersonID = ?').get(athletePersonId);
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Calculate a simple injury risk score (count of body parts with level >= 7)
    const levels = Object.values(sorenessData);
    const injuryRiskScore = levels.filter(l => l >= 7).length;
    const progressScore = Math.max(0, 100 - levels.reduce((a, b) => a + b, 0));

    // Create the soreness report
    const reportResult = db.prepare(`
      INSERT INTO SORENESS_REPORT (ReportDate, AthletePersonID, ProgressScore, InjuryRiskScore)
      VALUES (date('now'), ?, ?, ?)
    `).run(athletePersonId, progressScore, injuryRiskScore);

    const reportId = reportResult.lastInsertRowid;

    // Map muscle slugs to BodyPartIDs by name
    const bodyParts = db.prepare('SELECT BodyPartID, BodyPartName, Side FROM BODYPART').all() as {
      BodyPartID: number;
      BodyPartName: string;
      Side: string;
    }[];

    const insertEntry = db.prepare(`
      INSERT INTO SORENESS_ENTRY (ReportID, BodyPartID, SorenessLevel, ReportDate)
      VALUES (?, ?, ?, date('now'))
    `);

    // slug format: "lower-back" or "biceps_left"
    const slugToBodyPartId = (slug: string): number | null => {
      const [musclePart, side] = slug.split('_');
      const muscleName = musclePart.replace(/-/g, ' ').toLowerCase();
      // Try to match by name (case-insensitive) and optional side
      const match = bodyParts.find(bp => {
        const nameMatch = bp.BodyPartName.toLowerCase() === muscleName;
        if (!side) return nameMatch && (bp.Side === 'N/A' || bp.Side === null);
        return nameMatch && bp.Side?.toLowerCase() === side.toLowerCase();
      }) ?? bodyParts.find(bp => bp.BodyPartName.toLowerCase() === muscleName);
      return match?.BodyPartID ?? null;
    };

    const insertMany = db.transaction(() => {
      for (const [slug, level] of Object.entries(sorenessData)) {
        if (level === 0) continue;
        const bodyPartId = slugToBodyPartId(slug);
        if (bodyPartId) {
          insertEntry.run(reportId, bodyPartId, level);
        }
      }
    });

    insertMany();

    return NextResponse.json({ ok: true, reportId });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface BodyPartRow {
  BodyPartID: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { athleteId, soreness } = body as {
    athleteId?: number;
    soreness?: Record<string, number>;
  };

  if (!athleteId || !soreness || typeof soreness !== 'object') {
    return NextResponse.json({ error: 'athleteId and soreness object required' }, { status: 400 });
  }

  const db = getDb();

  const athlete = db.prepare('SELECT 1 FROM ATHLETE WHERE PersonID = ?').get(Number(athleteId));
  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // Derive simple aggregate scores from the submitted soreness levels
  const levels = Object.values(soreness).filter((v) => typeof v === 'number');
  const maxLevel = levels.length ? Math.max(...levels) : 0;
  const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
  const injuryRiskScore = Math.round(maxLevel * 10);   // 0-100
  const progressScore = Math.round(100 - avgLevel * 10); // 0-100

  const insertReport = db.prepare(
    'INSERT INTO SORENESS_REPORT (AthletePersonID, ProgressScore, InjuryRiskScore) VALUES (?, ?, ?)'
  );
  const insertEntry = db.prepare(
    'INSERT INTO SORENESS_ENTRY (ReportID, BodyPartID, SorenessLevel) VALUES (?, ?, ?)'
  );
  const findBodyPart = db.prepare(
    'SELECT BodyPartID FROM BODYPART WHERE BodyPartName = ? AND Side = ?'
  );
  const createBodyPart = db.prepare(
    'INSERT INTO BODYPART (BodyPartName, Side) VALUES (?, ?)'
  );

  const run = db.transaction(() => {
    const { lastInsertRowid: reportId } = insertReport.run(
      Number(athleteId),
      progressScore,
      injuryRiskScore
    );

    for (const [muscleKey, level] of Object.entries(soreness)) {
      // muscleKey format: "chest", "quadriceps_left", "hamstring_right"
      const underscoreIdx = muscleKey.lastIndexOf('_');
      let baseName: string;
      let side: string;

      if (
        underscoreIdx !== -1 &&
        (muscleKey.endsWith('_left') || muscleKey.endsWith('_right'))
      ) {
        baseName = muscleKey.slice(0, underscoreIdx);
        side = muscleKey.endsWith('_left') ? 'Left' : 'Right';
      } else {
        baseName = muscleKey;
        side = 'N/A';
      }

      // Capitalise first letter for readability
      const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      let bodyPart = findBodyPart.get(displayName, side) as BodyPartRow | undefined;
      if (!bodyPart) {
        const { lastInsertRowid } = createBodyPart.run(displayName, side);
        bodyPart = { BodyPartID: Number(lastInsertRowid) };
      }

      insertEntry.run(reportId, bodyPart.BodyPartID, level);
    }

    db.prepare(
      'INSERT INTO ATHLETE_SCORE_HISTORY (AthletePersonID, InjuryRiskScore, ProgressScore) VALUES (?, ?, ?)'
    ).run(Number(athleteId), injuryRiskScore, progressScore);

    return reportId;
  });

  const reportId = run();
  return NextResponse.json({ success: true, reportId });
}

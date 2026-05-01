import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

function ensurePresetColumn() {
  const db = getDb();
  const cols = db.pragma('table_info(ATHLETE)') as { name: string }[];
  if (!cols.some(c => c.name === 'SelectedPreset')) {
    db.exec('ALTER TABLE "ATHLETE" ADD COLUMN "SelectedPreset" TEXT');
  }
  return db;
}

// PUT /api/player/[id]/preset
// Body: { preset: string }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const personId = Number(id);

  if (isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
  }

  const { preset } = await req.json() as { preset?: string };

  if (!preset) {
    return NextResponse.json({ error: 'preset is required' }, { status: 400 });
  }

  const db = ensurePresetColumn();

  const athlete = db.prepare('SELECT PersonID FROM ATHLETE WHERE PersonID = ?').get(personId);
  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  db.prepare('UPDATE ATHLETE SET SelectedPreset = ? WHERE PersonID = ?').run(preset, personId);

  return NextResponse.json({ ok: true });
}

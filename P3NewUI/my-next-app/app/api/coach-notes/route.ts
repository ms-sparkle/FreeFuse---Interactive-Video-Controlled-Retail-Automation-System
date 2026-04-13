import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import getDb from '@/lib/db';

type SessionPayload = { personId: number; role: string };

async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { personId: payload.personId as number, role: payload.role as string };
  } catch {
    return null;
  }
}

function ensureTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS "COACH_NOTE" (
      "NoteID"           INTEGER PRIMARY KEY AUTOINCREMENT,
      "CoachPersonID"    INTEGER NOT NULL,
      "AthletePersonID"  INTEGER NOT NULL,
      "NoteDate"         DATE DEFAULT CURRENT_DATE,
      "NoteText"         TEXT NOT NULL,
      FOREIGN KEY("CoachPersonID")   REFERENCES "COACH"("PersonID"),
      FOREIGN KEY("AthletePersonID") REFERENCES "ATHLETE"("PersonID")
    )
  `);
  return db;
}

// GET /api/coach-notes
//   Athletes: returns all coach notes addressed to them
//   Coaches:  requires ?athleteId=N, returns notes for that athlete written by this coach
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = ensureTable();

  if (session.role === 'athlete') {
    const notes = db.prepare(`
      SELECT cn.NoteID, cn.NoteDate, cn.NoteText,
             p.FirstName AS CoachFirstName, p.LastName AS CoachLastName
      FROM COACH_NOTE cn
      JOIN PERSON p ON p.PersonID = cn.CoachPersonID
      WHERE cn.AthletePersonID = ?
      ORDER BY cn.NoteDate DESC, cn.NoteID DESC
    `).all(session.personId) as {
      NoteID: number; NoteDate: string; NoteText: string;
      CoachFirstName: string; CoachLastName: string;
    }[];
    return NextResponse.json({ notes });
  }

  if (session.role === 'coach') {
    const athleteId = new URL(req.url).searchParams.get('athleteId');
    if (!athleteId) return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
    const notes = db.prepare(`
      SELECT NoteID, NoteDate, NoteText
      FROM COACH_NOTE
      WHERE CoachPersonID = ? AND AthletePersonID = ?
      ORDER BY NoteDate DESC, NoteID DESC
    `).all(session.personId, Number(athleteId)) as {
      NoteID: number; NoteDate: string; NoteText: string;
    }[];
    return NextResponse.json({ notes });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST /api/coach-notes — coach writes a note to an athlete
// Body: { athleteId: number, text: string }
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { athleteId, text } = await req.json() as { athleteId?: number; text?: string };
  if (!athleteId || !text?.trim()) return NextResponse.json({ error: 'athleteId and text required' }, { status: 400 });

  const db = ensureTable();

  // Verify the athlete is on this coach's roster
  const linked = db.prepare(
    'SELECT 1 FROM ATHLETE_COACH WHERE CoachPersonID = ? AND AthletePersonID = ?'
  ).get(session.personId, athleteId);
  if (!linked) return NextResponse.json({ error: 'Athlete not on your roster' }, { status: 403 });

  const result = db.prepare(`
    INSERT INTO COACH_NOTE (CoachPersonID, AthletePersonID, NoteDate, NoteText)
    VALUES (?, ?, date('now'), ?)
  `).run(session.personId, athleteId, text.trim());

  const note = db.prepare('SELECT NoteID, NoteDate, NoteText FROM COACH_NOTE WHERE NoteID = ?')
    .get(result.lastInsertRowid) as { NoteID: number; NoteDate: string; NoteText: string };

  return NextResponse.json({ note });
}

// PATCH /api/coach-notes — coach edits their own note
// Body: { noteId: number, text: string }
export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { noteId, text } = await req.json() as { noteId?: number; text?: string };
  if (!noteId || !text?.trim()) return NextResponse.json({ error: 'noteId and text required' }, { status: 400 });

  const db = ensureTable();

  const existing = db.prepare('SELECT NoteID FROM COACH_NOTE WHERE NoteID = ? AND CoachPersonID = ?')
    .get(noteId, session.personId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('UPDATE COACH_NOTE SET NoteText = ? WHERE NoteID = ?').run(text.trim(), noteId);

  const note = db.prepare('SELECT NoteID, NoteDate, NoteText FROM COACH_NOTE WHERE NoteID = ?')
    .get(noteId) as { NoteID: number; NoteDate: string; NoteText: string };

  return NextResponse.json({ note });
}

// DELETE /api/coach-notes — coach deletes their own note
// Body: { noteId: number }
export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { noteId } = await req.json() as { noteId?: number };
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 });

  const db = ensureTable();

  const existing = db.prepare('SELECT NoteID FROM COACH_NOTE WHERE NoteID = ? AND CoachPersonID = ?')
    .get(noteId, session.personId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('DELETE FROM COACH_NOTE WHERE NoteID = ?').run(noteId);

  return NextResponse.json({ ok: true });
}

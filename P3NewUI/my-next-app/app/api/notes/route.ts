import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import getDb from '@/lib/db';

async function getPersonId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.personId as number;
  } catch {
    return null;
  }
}

function ensureTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS "NOTE" (
      "NoteID"   INTEGER PRIMARY KEY AUTOINCREMENT,
      "PersonID" INTEGER NOT NULL,
      "NoteDate" DATE DEFAULT CURRENT_DATE,
      "NoteText" TEXT NOT NULL,
      FOREIGN KEY("PersonID") REFERENCES "PERSON"("PersonID")
    )
  `);
  return db;
}

// GET /api/notes — returns all journal entries for the authenticated user
export async function GET(req: NextRequest) {
  const personId = await getPersonId(req);
  if (!personId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = ensureTable();

  const notes = db.prepare(`
    SELECT NoteID, NoteDate, NoteText
    FROM NOTE
    WHERE PersonID = ?
    ORDER BY NoteDate DESC, NoteID DESC
  `).all(personId) as { NoteID: number; NoteDate: string; NoteText: string }[];

  return NextResponse.json({ notes });
}

// POST /api/notes — creates a new journal entry
export async function POST(req: NextRequest) {
  const personId = await getPersonId(req);
  if (!personId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { text } = await req.json() as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: 'Note text is required' }, { status: 400 });

  const db = ensureTable();

  const result = db.prepare(`
    INSERT INTO NOTE (PersonID, NoteDate, NoteText) VALUES (?, date('now'), ?)
  `).run(personId, text.trim());

  const note = db.prepare(
    'SELECT NoteID, NoteDate, NoteText FROM NOTE WHERE NoteID = ?'
  ).get(result.lastInsertRowid) as { NoteID: number; NoteDate: string; NoteText: string };

  return NextResponse.json({ note });
}

// PUT /api/notes/[id] is handled in the dynamic route — this stub keeps the file clean
// PATCH /api/notes — updates an existing note's text
export async function PATCH(req: NextRequest) {
  const personId = await getPersonId(req);
  if (!personId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { noteId, text } = await req.json() as { noteId?: number; text?: string };
  if (!noteId || !text?.trim()) return NextResponse.json({ error: 'noteId and text are required' }, { status: 400 });

  const db = ensureTable();

  // Verify ownership
  const existing = db.prepare('SELECT NoteID FROM NOTE WHERE NoteID = ? AND PersonID = ?').get(noteId, personId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('UPDATE NOTE SET NoteText = ? WHERE NoteID = ?').run(text.trim(), noteId);

  const note = db.prepare('SELECT NoteID, NoteDate, NoteText FROM NOTE WHERE NoteID = ?')
    .get(noteId) as { NoteID: number; NoteDate: string; NoteText: string };

  return NextResponse.json({ note });
}

// DELETE /api/notes — deletes a note
export async function DELETE(req: NextRequest) {
  const personId = await getPersonId(req);
  if (!personId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { noteId } = await req.json() as { noteId?: number };
  if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 });

  const db = ensureTable();

  // Verify ownership before deleting
  const existing = db.prepare('SELECT NoteID FROM NOTE WHERE NoteID = ? AND PersonID = ?').get(noteId, personId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare('DELETE FROM NOTE WHERE NoteID = ?').run(noteId);

  return NextResponse.json({ ok: true });
}

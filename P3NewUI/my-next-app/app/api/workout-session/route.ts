import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// ==========================
// CREATE WORKOUT SESSION
// ==========================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { athleteId, workoutId, notes } = body as {
            athleteId?: number;
            workoutId?: number;
            notes?: string;
        };

        if (!athleteId || !workoutId) {
            return NextResponse.json(
                { error: 'athleteId and workoutId required' },
                { status: 400 }
            );
        }

        const db = getDb();

        const result = db
            .prepare(`
                INSERT INTO WORKOUT_SESSION 
                (AthletePersonID, WorkoutID, Notes) 
                VALUES (?, ?, ?)
            `)
            .run(Number(athleteId), Number(workoutId), notes ?? null);

        return NextResponse.json({
            success: true,
            sessionId: result.lastInsertRowid
        });

    } catch (err) {
        console.error('Workout session error:', err);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ==========================
// GET WORKOUT SESSIONS
// ==========================
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const athleteId = Number(searchParams.get('athleteId'));

        if (!athleteId) {
            return NextResponse.json(
                { error: 'athleteId required' },
                { status: 400 }
            );
        }

        const db = getDb();

        const sessions = db
            .prepare(`
                SELECT 
                    ws.SessionID,
                    ws.SessionDate,
                    w.WorkoutName,
                    ws.Notes
                FROM WORKOUT_SESSION ws
                JOIN WORKOUT w ON w.WorkoutID = ws.WorkoutID
                WHERE ws.AthletePersonID = ?
                ORDER BY ws.SessionDate DESC
            `)
            .all(athleteId);

        return NextResponse.json({ sessions });

    } catch (err) {
        console.error('Fetch sessions error:', err);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import workoutsData from '@/data/workouts.json';

export async function GET() {
  const exercises = workoutsData.exercises.map((e, i) => ({
    WorkoutID: i + 1,
    WorkoutName: e.name,
    BodyPartName: e.primary_nodes.join(', '),
  }));
  return NextResponse.json({ exercises });
}
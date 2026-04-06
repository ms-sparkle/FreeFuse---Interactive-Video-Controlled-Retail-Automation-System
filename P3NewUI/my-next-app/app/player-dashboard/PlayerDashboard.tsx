"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, AlertTriangle, CalendarDays, Dumbbell, LogOut,
  Settings, ShieldCheck, Target, TrendingUp, User, CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import BodyMapDisplay from '../components/BodyMapDisplay';
import SearchBar from '../components/SearchBar'; 

// ================= TYPES =================
type Tab = 'workout' | 'soreness' | 'history' | 'profile';

type Exercise = { 
  ExerciseID: number;
  Name: string;
  TargetMuscle: string;
};

type PlayerData = {
  player: {
    PersonID: number;
    FirstName: string;
    LastName: string;
    DateOfBirth: string;
    SportPlayed: string;
    Team: string;
    Sex: string;
    Height: number;
    Weight: number;
    HoursSpentWorkingOut: number;
  };
  latestReport: {
    ProgressScore: number;
    InjuryRiskScore: number;
    ReportDate: string;
  } | null;
  sorenessEntries: {
    BodyPartName: string;
    Side: string;
    SorenessLevel: number;
  }[];
  workoutSuggestions: {
    WorkoutName: string;
    Duration: number;
    Reps: number;
    BodyPartName: string;
  }[];
  sessions: {
    SessionDate: string;
    WorkoutName: string;
    Notes: string;
  }[];
};

export default function PlayerDashboard() {
  const router = useRouter();

  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('workout');

  // WORKOUT LOGGER STATE
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [workoutId, setWorkoutId] = useState<number | null>(null);

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem('session');
    router.push('/login');
  };

  // ================= LOAD DATA =================
  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (!raw) return;

    const session = JSON.parse(raw);

    // Player data
    fetch(`/api/player/${session.personId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    //  LOAD EXERCISES
    fetch('/api/exercises')
      .then(r => r.json())
      .then(d => {
        setExercises(d.exercises ?? []);
        if (d.exercises?.length > 0) {
          setWorkoutId(d.exercises[0].ExerciseID);
        }
      })
      .catch(console.error);

  }, []);

  // ================= LOG WORKOUT =================
  const logWorkout = async () => {
    try {
      const raw = localStorage.getItem('session');
      if (!raw || !workoutId) return;

      const session = JSON.parse(raw);

      const res = await fetch('/api/workout-session', {
        method: 'POST',
        body: JSON.stringify({
          athleteId: session.personId,
          workoutId,
          notes
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error();

      setNotes('');
      alert('Workout logged!');

      // refresh dashboard
      const updated = await fetch(`/api/player/${session.personId}`).then(r => r.json());
      setData(updated);

    } catch {
      alert('Failed to log workout.');
    }
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!data) return <div className="text-white p-10">No data</div>;

  const { player, latestReport, workoutSuggestions, sessions } = data;
  const atRisk = (latestReport?.InjuryRiskScore ?? 0) > 0;

  const TABS = [
    { id: 'workout', label: 'Workout' },
    { id: 'soreness', label: 'Soreness' },
    { id: 'history', label: 'History' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <h1 className="text-xl font-bold text-cyan-400">
            Welcome back, {player.FirstName}
          </h1>

          <div className="flex items-center gap-3">

            {/* SEARCH BAR */}
            <div className="hidden md:block w-64">
              <SearchBar />
            </div>

            <span className={`px-3 py-1 rounded text-xs ${
              atRisk ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {atRisk ? 'Injury Risk' : 'Good'}
            </span>

            <button onClick={logout} className="text-sm flex items-center gap-2">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="flex gap-4 px-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-3 border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <div className="p-6">

        {/* ================= WORKOUT TAB ================= */}
        {activeTab === 'workout' && (
          <div className="space-y-6">

            {/* LOG WORKOUT */}
            <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h2 className="text-lg font-semibold mb-3">Log Workout</h2>

              {exercises.length === 0 ? (
                <p className="text-slate-500 text-sm">No exercises available.</p>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={workoutId ?? ''}
                    onChange={(e) => setWorkoutId(Number(e.target.value))}
                    className="bg-slate-800 p-2 rounded"
                  >
                    {exercises.map(e => (
                      <option key={e.ExerciseID} value={e.ExerciseID}>
                        {e.Name} ({e.TargetMuscle})
                      </option>
                    ))}
                  </select>

                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes..."
                    className="bg-slate-800 p-2 rounded flex-1"
                  />

                  <button
                    onClick={logWorkout}
                    className="bg-cyan-500 px-4 py-2 rounded text-black"
                  >
                    Log
                  </button>
                </div>
              )}
            </section>

            {/* EXISTING RECOMMENDATIONS */}
            <section>
              <h2 className="text-lg mb-4">Workout Suggestions</h2>

              <div className="grid md:grid-cols-3 gap-4">
                {workoutSuggestions.map(w => (
                  <div key={w.WorkoutName} className="bg-slate-800 p-4 rounded">
                    <h3>{w.WorkoutName}</h3>
                    <p>{w.Reps} reps</p>
                    <p>{w.Duration} min</p>
                  </div>
                ))}
              </div>
            </section>

            {/* RECENT SESSIONS */}
            <section>
              <h2 className="text-lg mb-4">Recent Sessions</h2>

              {sessions.map((s, i) => (
                <div key={i} className="bg-slate-800 p-3 rounded mb-2">
                  {s.WorkoutName} - {s.SessionDate}
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ================= SORENESS ================= */}
        {activeTab === 'soreness' && (
          <BodyMapDisplay
            sorenessRows={data.sorenessEntries}
            sex={player.Sex}
          />
        )}

        {/* ================= HISTORY ================= */}
        {activeTab === 'history' && (
          <div>
            {sessions.map((s, i) => (
              <div key={i}>{s.WorkoutName} - {s.SessionDate}</div>
            ))}
          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeTab === 'profile' && (
          <div>
            <p>{player.FirstName} {player.LastName}</p>
          </div>
        )}

      </div>
    </main>
  );
}

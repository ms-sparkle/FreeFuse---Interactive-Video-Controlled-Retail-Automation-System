"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, CalendarDays, Dumbbell, LogOut,
  ShieldCheck, TrendingUp, User
} from 'lucide-react';

import BodyMapDisplay from '../components/BodyMapDisplay';
import SearchBar from '../components/SearchBar';

// ================= TYPES =================
type Tab = 'workout' | 'soreness' | 'history' | 'profile';

type Exercise = {
  ExerciseID: number;
  Name: string;
  TargetMuscle: string;
};

type Recommendation = {
  WorkoutID: number;
  WorkoutName: string;
  BodyPartName: string;
};

type PlayerData = {
  player: {
    PersonID: number;
    FirstName: string;
    LastName: string;
    Sex: string;
  };
  sorenessEntries: {
    BodyPartName: string;
    Side: string;
    SorenessLevel: number;
  }[];
  sessions: {
    SessionDate: string;
    WorkoutName: string;
  }[];
};

// ================= COMPONENT =================
export default function PlayerDashboard() {
  const router = useRouter();

  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('workout');

  // 🔥 WORKOUT LOGGER
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  // 🤖 AI
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([]);
  const [aiMessage, setAiMessage] = useState('');

  // ================= LOAD DATA =================
  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (!raw) return;

    const session = JSON.parse(raw);

    // Player
    fetch(`/api/player/${session.personId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    // Exercises
    fetch('/api/exercises')
      .then(r => r.json())
      .then(d => {
        setExercises(d.exercises ?? []);
        if (d.exercises?.length > 0) {
          setWorkoutId(d.exercises[0].ExerciseID);
        }
      });

    // AI Recommendations
    fetch(`/api/recommendations?athleteId=${session.personId}`)
      .then(r => r.json())
      .then(d => {
        const recs = d.recommendations ?? [];
        setAiRecommendations(recs);

        if (recs.length === 0) {
          setAiMessage("You're fully recovered — train anything today.");
        } else {
          setAiMessage("Adjusted based on soreness & recent workouts.");
        }
      });

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

      // Refresh dashboard
      const updated = await fetch(`/api/player/${session.personId}`).then(r => r.json());
      setData(updated);

      // 🔥 Refresh AI
      const ai = await fetch(`/api/recommendations?athleteId=${session.personId}`).then(r => r.json());
      setAiRecommendations(ai.recommendations ?? []);

    } catch {
      alert('Failed to log workout.');
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem('session');
    router.push('/login');
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!data) return <div className="text-white p-10">No data</div>;

  const { player, sessions } = data;

  const TABS = [
    { id: 'workout', label: 'Workout' },
    { id: 'soreness', label: 'Soreness' },
    { id: 'history', label: 'History' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="text-xl text-cyan-400">
          Welcome, {player.FirstName}
        </h1>

        <div className="flex items-center gap-3">
          <div className="hidden md:block w-64">
            <SearchBar />
          </div>

          <button onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-4 px-6 border-b border-slate-800">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`py-3 ${
              activeTab === tab.id ? 'text-cyan-400' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6">

        {/* WORKOUT TAB */}
        {activeTab === 'workout' && (
          <>
            {/* LOG WORKOUT */}
            <section className="bg-slate-900 p-4 rounded-xl">
              <h2 className="mb-3 font-semibold">Log Workout</h2>

              <div className="flex gap-2">
                <select
                  value={workoutId ?? ''}
                  onChange={(e) => setWorkoutId(Number(e.target.value))}
                  className="bg-slate-800 p-2 rounded"
                >
                  {exercises.map(e => (
                    <option key={e.ExerciseID} value={e.ExerciseID}>
                      {e.Name}
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
                  className="bg-cyan-500 px-4 rounded text-black"
                >
                  Log
                </button>
              </div>
            </section>

            {/* AI RECOMMENDATIONS */}
            <section>
              <h2 className="text-lg font-semibold mb-2">AI Recommendations</h2>
              <p className="text-cyan-400 text-sm mb-4">{aiMessage}</p>

              <div className="grid md:grid-cols-3 gap-4">
                {aiRecommendations.map(rec => (
                  <div key={rec.WorkoutID} className="bg-slate-900 p-4 rounded">
                    <h3>{rec.WorkoutName}</h3>
                    <p className="text-sm text-gray-400">{rec.BodyPartName}</p>

                    <button
                      onClick={() => setWorkoutId(rec.WorkoutID)}
                      className="mt-2 w-full bg-cyan-500 text-black py-1 rounded"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* RECENT */}
            <section>
              <h2 className="font-semibold mb-2">Recent Sessions</h2>
              {sessions.map((s, i) => (
                <div key={i} className="bg-slate-800 p-2 rounded mb-1">
                  {s.WorkoutName} - {s.SessionDate}
                </div>
              ))}
            </section>
          </>
        )}

        {/* SORENESS */}
        {activeTab === 'soreness' && (
          <BodyMapDisplay
            sorenessRows={data.sorenessEntries}
            sex={player.Sex}
          />
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div>
            {sessions.map((s, i) => (
              <div key={i}>{s.WorkoutName}</div>
            ))}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div>
            {player.FirstName} {player.LastName}
          </div>
        )}

      </div>
    </main>
  );
}

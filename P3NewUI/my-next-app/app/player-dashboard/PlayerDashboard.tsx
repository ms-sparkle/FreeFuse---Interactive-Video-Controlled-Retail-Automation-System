"use client";
import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  latestReport: { ProgressScore: number; InjuryRiskScore: number; ReportDate: string } | null;
  sorenessEntries: { BodyPartName: string; Side: string; SorenessLevel: number }[];
  workoutSuggestions: { WorkoutName: string; Duration: number; Reps: number; BodyPartName: string }[];
  sessions: { SessionDate: string; WorkoutName: string; Notes: string }[];
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export default function PlayerDashboard() {
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (!raw) return;
    const session = JSON.parse(raw);
    fetch(`/api/player/${session.personId}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading…
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Unable to load player data. Please log in again.
      </main>
    );
  }

  const { player, latestReport, sorenessEntries, workoutSuggestions, sessions } = data;
  const atRisk = (latestReport?.InjuryRiskScore ?? 0) > 0;

  // Build chart data from sessions (most recent first → reverse for display)
  const chartData = [...sessions].reverse().map(s => ({
    day: s.SessionDate,
    workout: s.WorkoutName,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-cyan-400">
              Welcome back, {player.FirstName}!
            </h1>
            <p className="text-slate-400 mt-2">Here&apos;s your personalized fitness dashboard</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
            <CalendarDays size={16} className="text-cyan-300" />
            <span className="font-semibold">Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Recovery banner */}
        <div className={`mb-6 rounded-xl border px-4 py-4 ${atRisk ? 'border-red-800/60 bg-red-950/30' : 'border-emerald-800/60 bg-emerald-950/30'}`}>
          <div className={`flex items-center gap-2 font-semibold ${atRisk ? 'text-red-300' : 'text-emerald-300'}`}>
            <ShieldCheck size={16} />
            {atRisk ? 'Injury Risk Detected' : 'Good Recovery Status'}
          </div>
          <p className={`text-sm mt-1 ${atRisk ? 'text-red-200/90' : 'text-emerald-200/90'}`}>
            {atRisk
              ? 'Review your soreness below and follow the modified workout plan.'
              : 'Your muscles are recovering well. You can proceed with normal training.'}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Personal Info */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-6">
              <Activity size={18} />
              Personal Information
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Name</span><span>{player.FirstName} {player.LastName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Sex</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{player.Sex}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Age</span><span>{calcAge(player.DateOfBirth)} years</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Height</span><span>{player.Height}&quot;</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Weight</span><span>{player.Weight} lbs</span></div>
              <hr className="border-slate-800" />
              <div className="flex justify-between"><span className="text-slate-400">Sport</span><span>{player.SportPlayed}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Team</span><span>{player.Team}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Hrs / Week</span><span>{player.HoursSpentWorkingOut}</span></div>
              {latestReport && (
                <>
                  <hr className="border-slate-800" />
                  <div className="flex justify-between"><span className="text-slate-400">Progress Score</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{latestReport.ProgressScore}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Injury Risk</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{latestReport.InjuryRiskScore}</span></div>
                </>
              )}
            </div>
          </section>

          {/* Workout Recommendations */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
              <Dumbbell size={18} />
              Workout Recommendations
            </h2>
            <p className="text-slate-400 mb-6">Based on your current muscle soreness levels</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workoutSuggestions.length === 0 ? (
                <p className="text-slate-500 text-sm col-span-2">No recommendations yet. Complete a check-in first.</p>
              ) : workoutSuggestions.map((item) => (
                <div key={item.WorkoutName} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{item.WorkoutName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs border bg-cyan-500/15 text-cyan-300 border-cyan-500/40">
                      {item.BodyPartName}
                    </span>
                  </div>

                  <p className="text-slate-300 mb-4">{item.Reps} reps · {item.Duration} min</p>

                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 transition-colors">
                    <Target size={16} />
                    Start Workout
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Sessions Chart */}
        {sessions.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
              <TrendingUp size={18} />
              Recent Sessions
            </h2>
            <p className="text-slate-400 mb-5">Your last {sessions.length} logged workouts</p>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#06b6d4' }} />
                  <Line type="monotone" dataKey="day" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Current Soreness */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-1">Current Muscle Soreness</h2>
          <p className="text-slate-400 mb-5">From your most recent check-in</p>

          {sorenessEntries.length === 0 ? (
            <p className="text-slate-500 text-sm">No soreness recorded yet. Head to the check-in page to submit today&apos;s report.</p>
          ) : (
            <div className="space-y-2 max-w-sm">
              {sorenessEntries.map((entry, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-white">{entry.BodyPartName}{entry.Side !== 'N/A' ? ` (${entry.Side})` : ''}</span>
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-sm">
                    {entry.SorenessLevel}/10
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


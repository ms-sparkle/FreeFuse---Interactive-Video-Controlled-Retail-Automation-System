'use client';
import { useEffect, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, ShieldCheck, Target, TrendingUp } from 'lucide-react';

interface SorenessEntry {
  BodyPartName: string;
  Side: string;
  SorenessLevel: number;
}

interface WorkoutSession {
  SessionID: number;
  SessionDate: string;
  WorkoutName: string;
  Notes: string | null;
}

interface PlayerData {
  person: {
    PersonID: number;
    FirstName: string;
    LastName: string;
    DateOfBirth: string;
    SportPlayed: string;
    Team: string;
  };
  latestReport: {
    InjuryRiskScore: number;
    ProgressScore: number;
    ReportDate: string;
  } | null;
  sorenessEntries: SorenessEntry[];
  recentSessions: WorkoutSession[];
}

export default function PlayerDashboard() {
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (!raw) { setError('Not logged in.'); return; }
    const session = JSON.parse(raw);
    fetch(`/api/player/${session.personId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  const { person, latestReport, sorenessEntries, recentSessions } = data;
  const injuryRisk = latestReport?.InjuryRiskScore ?? 0;
  const recoveryGood = injuryRisk < 50;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-cyan-400">
              Welcome back, {person.FirstName}!
            </h1>
            <p className="text-slate-400 mt-2">Here&apos;s your personalized fitness dashboard</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
            <CalendarDays size={16} className="text-cyan-300" />
            <span className="font-semibold">Today: {today}</span>
          </div>
        </div>

        <div className={`mb-6 rounded-xl border px-4 py-4 ${recoveryGood ? 'border-emerald-800/60 bg-emerald-950/30' : 'border-red-800/60 bg-red-950/30'}`}>
          <div className={`flex items-center gap-2 font-semibold ${recoveryGood ? 'text-emerald-300' : 'text-red-300'}`}>
            <ShieldCheck size={16} />
            {recoveryGood ? 'Good Recovery Status' : 'Elevated Injury Risk'}
          </div>
          <p className={`text-sm mt-1 ${recoveryGood ? 'text-emerald-200/90' : 'text-red-200/90'}`}>
            {recoveryGood
              ? 'Your muscles are recovering well. You can proceed with normal training.'
              : 'High soreness detected. Consider a reduced-intensity session today.'}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-6">
              <Activity size={18} />
              Personal Information
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Name</span><span>{person.FirstName} {person.LastName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Sport</span><span>{person.SportPlayed ?? '–'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Team</span><span>{person.Team ?? '–'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date of Birth</span><span>{person.DateOfBirth ?? '–'}</span></div>
              <hr className="border-slate-800" />
              <div className="flex justify-between"><span className="text-slate-400">Progress Score</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{latestReport?.ProgressScore ?? '–'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Injury Risk</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{injuryRisk}</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
              <Dumbbell size={18} />
              Recent Workout Sessions
            </h2>
            <p className="text-slate-400 mb-6">Your last logged training sessions</p>
            {recentSessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No sessions logged yet. Complete a workout to see it here.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentSessions.map((s) => (
                  <div key={s.SessionID} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{s.WorkoutName}</h3>
                      <span className="text-xs text-slate-400">{s.SessionDate}</span>
                    </div>
                    {s.Notes && <p className="text-slate-300 text-sm mb-4">{s.Notes}</p>}
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 transition-colors">
                      <Target size={16} />
                      Repeat Workout
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
            <TrendingUp size={18} />
            Current Muscle Soreness
          </h2>
          <p className="text-slate-400 mb-5">
            {latestReport ? `From check-in on ${latestReport.ReportDate}` : 'No check-in recorded yet'}
          </p>
          {sorenessEntries.length === 0 ? (
            <p className="text-slate-500 text-sm">Complete a body check-in to see your soreness map here.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sorenessEntries.map((entry, i) => (
                <div key={i} className="max-w-sm rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-white text-sm">{entry.BodyPartName}{entry.Side !== 'N/A' ? ` (${entry.Side})` : ''}</span>
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

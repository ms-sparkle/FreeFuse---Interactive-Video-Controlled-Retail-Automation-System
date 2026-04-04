"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, CalendarDays, Dumbbell, LogOut, Settings, ShieldCheck, Target, TrendingUp, User, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'workout' | 'soreness' | 'profile';

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
  coaches: Coach[];
  latestReport: { ProgressScore: number; InjuryRiskScore: number; ReportDate: string } | null;
  sorenessEntries: { BodyPartName: string; Side: string; SorenessLevel: number }[];
  workoutSuggestions: { WorkoutName: string; Duration: number; Reps: number; BodyPartName: string }[];
  sessions: { SessionDate: string; WorkoutName: string; Notes: string }[];
};

type Coach = {
  PersonID: number;
  FirstName: string;
  LastName: string;
  Email: string;
};

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

type ProfileForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  height: number;
  weight: number;
  sportPlayed: string;
  team: string;
  hoursSpentWorkingOut: number;
};


export default function PlayerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [inviteCoachValue, setInviteCoachValue] = useState('');
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  const handleInviteCoachUI = () => {
      if (!inviteCoachValue) return;

      // 1. Clear the text field
      setInviteCoachValue('');

      // 2. Show the confirmation message
      setShowInviteSuccess(true);

      // 3. Hide the message after 3 seconds
      setTimeout(() => {
        setShowInviteSuccess(false);
      }, 3000);
  };

  const handleRemoveCoach = async (coachId: number) => {
    if (!confirm("Remove this coach from your roster?")) return;
    try {
      await fetch(`/api/player/remove-coach/${coachId}`, { method: 'DELETE' });
      setData(prev => prev ? {
        ...prev,
        coaches: prev.coaches.filter(c => c.PersonID !== coachId)
      } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('session');
    router.push('/login');
  };

  const startEditing = () => {
    if (!data) return;
    setForm({
      firstName: data.player.FirstName,
      lastName: data.player.LastName,
      dateOfBirth: data.player.DateOfBirth,
      sex: data.player.Sex,
      height: data.player.Height,
      weight: data.player.Weight,
      sportPlayed: data.player.SportPlayed,
      team: data.player.Team,
      hoursSpentWorkingOut: data.player.HoursSpentWorkingOut,
    });
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setForm(null);
    setSaveError(null);
  };

  const saveProfile = async () => {
    if (!form) return;
    const raw = localStorage.getItem('session');
    if (!raw) return;
    const session = JSON.parse(raw);
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/player/${session.personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      // Re-fetch fresh data
      const updated = await fetch(`/api/player/${session.personId}`).then(r => r.json());
      setData(updated);
      setEditing(false);
      setForm(null);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  const chartData = [...sessions].reverse().map(s => ({
    day: s.SessionDate,
    workout: s.WorkoutName,
  }));

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'workout', label: 'Workout', icon: <Dumbbell size={16} /> },
    { id: 'soreness', label: 'Soreness', icon: <Activity size={16} /> },
    { id: 'profile', label: 'Profile & Settings', icon: <User size={16} /> },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-cyan-400">
              Welcome back, {player.FirstName}!
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Recovery status badge */}
            <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
              ${atRisk
                ? 'bg-red-950/50 border-red-700 text-red-300'
                : 'bg-emerald-950/50 border-emerald-700 text-emerald-300'}`}>
              {atRisk ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
              {atRisk ? 'Injury Risk' : 'Cleared to Train'}
            </span>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* ── TAB NAV ── */}
        <nav className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-slate-800/60">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* ══ WORKOUT TAB ══ */}
        {activeTab === 'workout' && (
          <div className="space-y-6">
            {/* Injury risk banner */}
            <div className={`rounded-xl border px-4 py-4 ${atRisk ? 'border-red-800/60 bg-red-950/30' : 'border-emerald-800/60 bg-emerald-950/30'}`}>
              <div className={`flex items-center gap-2 font-semibold ${atRisk ? 'text-red-300' : 'text-emerald-300'}`}>
                <ShieldCheck size={16} />
                {atRisk ? 'Injury Risk Detected' : 'Good Recovery Status'}
              </div>
              <p className={`text-sm mt-1 ${atRisk ? 'text-red-200/90' : 'text-emerald-200/90'}`}>
                {atRisk
                  ? 'Review your soreness and follow the modified workout plan below.'
                  : 'Your muscles are recovering well. You can proceed with normal training.'}
              </p>
              {latestReport && (
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-slate-400">Progress score: <span className="text-white font-semibold">{latestReport.ProgressScore}</span></span>
                  <span className="text-slate-400">Injury risk: <span className={`font-semibold ${atRisk ? 'text-red-300' : 'text-emerald-300'}`}>{latestReport.InjuryRiskScore}</span></span>
                  <span className="text-slate-400">Last check-in: <span className="text-white font-semibold">{latestReport.ReportDate}</span></span>
                </div>
              )}
            </div>

            {/* Workout recommendations */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-4">
                <Dumbbell size={18} />
                Workout Recommendations
                <span className="text-xs text-slate-500 font-normal ml-1">Based on your check-in</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workoutSuggestions.length === 0 ? (
                  <p className="text-slate-500 text-sm col-span-3">No recommendations yet — complete a check-in first.</p>
                ) : workoutSuggestions.map((item) => (
                  <div key={item.WorkoutName} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{item.WorkoutName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs border bg-cyan-500/15 text-cyan-300 border-cyan-500/40">
                        {item.BodyPartName}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{item.Reps} reps · {item.Duration} min</p>
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 transition-colors">
                      <Target size={16} />
                      Start Workout
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent sessions */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-4">
                <TrendingUp size={18} />
                Recent Sessions
              </h2>
              {sessions.length === 0 ? (
                <p className="text-slate-500 text-sm">No sessions logged yet.</p>
              ) : (
                <>
                  <div className="h-[220px] w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#06b6d4' }} />
                        <Line type="monotone" dataKey="day" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {sessions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                        <span className="font-medium">{s.WorkoutName}</span>
                        <div className="flex items-center gap-4">
                          {s.Notes && <span className="text-slate-500 hidden md:block">{s.Notes}</span>}
                          <span className="text-slate-400">{s.SessionDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* ══ SORENESS TAB ══ */}
        {activeTab === 'soreness' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-cyan-300">Current Muscle Soreness</h2>
                <p className="text-slate-400 text-sm">From your most recent check-in{latestReport ? ` on ${latestReport.ReportDate}` : ''}</p>
              </div>
              <a href="/check-in" className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-colors">
                Update Check-In
              </a>
            </div>

            {sorenessEntries.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No soreness recorded yet</p>
                <p className="text-slate-500 text-sm mt-1">Complete a check-in to see your soreness data here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sorenessEntries.map((entry, i) => {
                  const level = entry.SorenessLevel;
                  const color = level >= 7 ? 'border-red-700 bg-red-950/30 text-red-300'
                    : level >= 4 ? 'border-yellow-700 bg-yellow-950/30 text-yellow-300'
                    : 'border-emerald-700 bg-emerald-950/30 text-emerald-300';
                  const bar = level >= 7 ? 'bg-red-500' : level >= 4 ? 'bg-yellow-500' : 'bg-emerald-500';
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white">
                          {entry.BodyPartName}{entry.Side !== 'N/A' ? ` (${entry.Side})` : ''}
                        </span>
                        <span className="text-lg font-bold">{level}<span className="text-sm font-normal text-slate-400">/10</span></span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${level * 10}%` }} />
                      </div>
                      <p className="text-xs mt-2 opacity-75">
                        {level >= 7 ? 'High — avoid loading this area' : level >= 4 ? 'Moderate — train with caution' : 'Low — cleared for normal training'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ PROFILE & SETTINGS TAB ══ */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            {/* Personal Info */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300">
                  <User size={18} />
                  Personal Information
                </h2>
                {!editing ? (
                  <button
                    onClick={startEditing}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold transition-colors text-xs"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {saveError && (
                <p className="text-red-400 text-xs mb-4">{saveError}</p>
              )}

              {!editing ? (
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <span className="text-slate-400">First Name</span><span>{player.FirstName}</span>
                  <span className="text-slate-400">Last Name</span><span>{player.LastName}</span>
                  <span className="text-slate-400">Date of Birth</span><span>{player.DateOfBirth}</span>
                  <span className="text-slate-400">Sex</span><span>{player.Sex}</span>
                  <span className="text-slate-400">Height</span><span>{player.Height}&quot;</span>
                  <span className="text-slate-400">Weight</span><span>{player.Weight} lbs</span>
                  <span className="text-slate-400">Sport</span><span>{player.SportPlayed}</span>
                  <span className="text-slate-400">Team</span><span>{player.Team}</span>
                  <span className="text-slate-400">Hrs / Week</span><span>{player.HoursSpentWorkingOut}</span>
                </div>
              ) : form && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">First Name</label>
                    <input
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Last Name</label>
                    <input
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Date of Birth</label>
                    <input
                      type="date"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.dateOfBirth}
                      onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Sex</label>
                    <select
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.sex}
                      onChange={e => setForm({ ...form, sex: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Height (inches)</label>
                    <input
                      type="number"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.height}
                      onChange={e => setForm({ ...form, height: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Weight (lbs)</label>
                    <input
                      type="number"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Sport</label>
                    <input
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.sportPlayed}
                      onChange={e => setForm({ ...form, sportPlayed: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Team</label>
                    <input
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.team}
                      onChange={e => setForm({ ...form, team: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-slate-400 text-xs">Hours Working Out / Week</label>
                    <input
                      type="number"
                      step="0.5"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      value={form.hoursSpentWorkingOut}
                      onChange={e => setForm({ ...form, hoursSpentWorkingOut: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </section>
            {/* ══ COACH MANAGEMENT ══ */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300">
                  <ShieldCheck size={18} />
                  My Coaches
                </h2>
              </div>

            {/* ── INVITE BOX (UI ONLY) ── */}
              <div className="mb-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Invite New Coach
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Coach username or email..." 
                    value={inviteCoachValue}
                    onChange={(e) => setInviteCoachValue(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-white"
                  />
                  <button 
                    onClick={handleInviteCoachUI}
                    disabled={!inviteCoachValue}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Invite
                  </button>
                </div>

                {/* Confirmation Message */}
                {showInviteSuccess && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 size={14} />
                    Coach invited!
                  </div>
                )}
              </div>

            {/* Coaches List */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block px-1">
                Active Coaches
              </label>
              {data.coaches?.length === 0 ? (
                <p className="text-slate-500 text-sm italic px-1">No coaches assigned to your profile.</p>
              ) : (
                data.coaches?.map(coach => (
                  <div key={coach.PersonID} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 group hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        {coach.FirstName[0]}{coach.LastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{coach.FirstName} {coach.LastName}</p>
                        <p className="text-[10px] text-slate-500">{coach.Email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveCoach(coach.PersonID)}
                      className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-all"
                      title="Remove Coach"
                    >
                      <LogOut size={16} className="rotate-180" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

            {/* Settings */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-5">
                <Settings size={18} />
                Settings
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium">Account</p>
                    <p className="text-slate-400 text-xs mt-0.5">Manage your login credentials</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs">
                    Change Password
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-red-400">Sign Out</p>
                    <p className="text-slate-400 text-xs mt-0.5">Log out of your account</p>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50 transition-colors text-xs"
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, LogOut, Settings, ShieldCheck, User, CheckCircle2 } from 'lucide-react';

import BodyMapDisplay from '../components/BodyMapDisplay';
import SearchBar from '../components/SearchBar';

// ================= TYPES =================
type Tab = 'workout' | 'soreness' | 'history' | 'profile';

type Exercise = {
  ExerciseID: number;
  Name: string;
  TargetMuscle: string;
};

type Coach = {
  PersonID: number;
  FirstName: string;
  LastName: string;
  Email: string;
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
  coaches: Coach[];
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

  // Profile editing state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);

  // Coach invite state
  const [inviteCoachValue, setInviteCoachValue] = useState('');
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Workout logger state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [workoutId, setWorkoutId] = useState<number | null>(null);

  // ================= LOGOUT =================
  const logout = async () => {
    localStorage.removeItem('session');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // ================= LOAD DATA =================
  useEffect(() => {
    const raw = localStorage.getItem('session');
    if (!raw) { router.push('/login'); return; }
    const session = JSON.parse(raw);

    fetch(`/api/player/${session.personId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    fetch('/api/exercises')
      .then(r => r.ok ? r.json() : { exercises: [] })
      .then(d => {
        setExercises(d.exercises ?? []);
        if (d.exercises?.length > 0) setWorkoutId(d.exercises[0].ExerciseID);
      })
      .catch(console.error);
  }, [router]);

  // ================= LOG WORKOUT =================
  const logWorkout = async () => {
    try {
      const raw = localStorage.getItem('session');
      if (!raw || !workoutId) return;
      const session = JSON.parse(raw);

      const res = await fetch('/api/workout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: session.personId, workoutId, notes }),
      });
      if (!res.ok) throw new Error();
      setNotes('');
      alert('Workout logged!');
      const updated = await fetch(`/api/player/${session.personId}`).then(r => r.json());
      setData(updated);
    } catch {
      alert('Failed to log workout.');
    }
  };

  // ================= INVITE COACH =================
  const handleInviteCoachUI = async () => {
    if (!inviteCoachValue) return;
    try {
      const res = await fetch('/api/player/invite-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteCoachValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? 'Failed to invite coach');
        return;
      }
      setInviteCoachValue('');
      setShowInviteSuccess(true);
      setTimeout(() => setShowInviteSuccess(false), 3000);
      const raw = localStorage.getItem('session');
      if (raw) {
        const session = JSON.parse(raw);
        const updated = await fetch(`/api/player/${session.personId}`).then(r => r.json());
        setData(updated);
      }
    } catch {
      alert('Network error. Please try again.');
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPasswordError(json.error ?? 'Failed to change password');
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(false); }, 1500);
      }
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // ================= REMOVE COACH =================
  const handleRemoveCoach = async (coachId: number) => {
    if (!confirm('Remove this coach from your roster?')) return;
    try {
      await fetch(`/api/player/remove-coach/${coachId}`, { method: 'DELETE' });
      setData(prev => prev ? { ...prev, coaches: prev.coaches.filter(c => c.PersonID !== coachId) } : null);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= PROFILE EDITING =================
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

  const cancelEditing = () => { setEditing(false); setForm(null); setSaveError(null); };

  const saveProfile = async () => {
    if (!form) return;
    const raw = localStorage.getItem('session');
    if (!raw) { router.push('/login'); return; }
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
          <h1 className="text-xl font-bold text-cyan-400">Welcome back, {player.FirstName}!</h1>
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-64"><SearchBar /></div>
            <span className={`px-3 py-1 rounded text-xs font-semibold ${atRisk ? 'bg-red-500' : 'bg-green-500'}`}>
              {atRisk ? 'Injury Risk' : 'Cleared to Train'}
            </span>
            <button onClick={logout} className="text-sm flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
        <div className="flex gap-4 px-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto w-full">

        {/* ================= WORKOUT TAB ================= */}
        {activeTab === 'workout' && (
          <div className="space-y-6">

            {/* Injury risk banner */}
            <div className={`rounded-xl border px-4 py-4 ${atRisk ? 'border-red-800/60 bg-red-950/30' : 'border-emerald-800/60 bg-emerald-950/30'}`}>
              <p className={`font-semibold text-sm ${atRisk ? 'text-red-300' : 'text-emerald-300'}`}>
                {atRisk ? 'Injury Risk Detected — follow the modified workout plan below.' : 'Good Recovery Status — you can proceed with normal training.'}
              </p>
              {latestReport && (
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>Progress: <span className="text-white font-semibold">{latestReport.ProgressScore}</span></span>
                  <span>Injury risk: <span className={`font-semibold ${atRisk ? 'text-red-300' : 'text-emerald-300'}`}>{latestReport.InjuryRiskScore}</span></span>
                  <span>Last check-in: <span className="text-white font-semibold">{latestReport.ReportDate}</span></span>
                </div>
              )}
            </div>

            {/* Log Workout */}
            <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Dumbbell size={18} className="text-cyan-400" /> Log Workout
              </h2>
              {exercises.length === 0 ? (
                <p className="text-slate-500 text-sm">No exercises available.</p>
              ) : (
                <div className="flex gap-3">
                  <select
                    value={workoutId ?? ''}
                    onChange={(e) => setWorkoutId(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-white text-sm"
                  >
                    {exercises.map(e => (
                      <option key={e.ExerciseID} value={e.ExerciseID}>{e.Name} ({e.TargetMuscle})</option>
                    ))}
                  </select>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes..."
                    className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex-1 text-sm text-white"
                  />
                  <button onClick={logWorkout} className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg text-black font-semibold text-sm transition-colors">
                    Log
                  </button>
                </div>
              )}
            </section>

            {/* Workout Suggestions */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-cyan-300">Workout Suggestions</h2>
              {workoutSuggestions.length === 0 ? (
                <p className="text-slate-500 text-sm">No recommendations yet — complete a check-in first.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {workoutSuggestions.map(w => (
                    <div key={w.WorkoutName} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <h3 className="font-semibold text-white mb-1">{w.WorkoutName}</h3>
                      <p className="text-slate-400 text-sm">{w.Reps} reps · {w.Duration} min</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">{w.BodyPartName}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Sessions */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-cyan-300">Recent Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-slate-500 text-sm">No sessions logged yet.</p>
              ) : (
                <div className="space-y-2">
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
              )}
            </section>
          </div>
        )}

        {/* ================= SORENESS TAB ================= */}
        {activeTab === 'soreness' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-cyan-300">Current Muscle Soreness</h2>
                <p className="text-slate-400 text-sm">From your most recent check-in{latestReport ? ` on ${latestReport.ReportDate}` : ''}</p>
              </div>
              <a href="/check-in" className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-colors">
                Update Check-In
              </a>
            </div>
            <BodyMapDisplay sorenessRows={data.sorenessEntries} sex={player.Sex} />
          </div>
        )}

        {/* ================= HISTORY TAB ================= */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-cyan-300 mb-4">Session History</h2>
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No sessions logged yet.</p>
            ) : (
              sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                  <span className="font-medium">{s.WorkoutName}</span>
                  <div className="flex items-center gap-4">
                    {s.Notes && <span className="text-slate-500 hidden md:block">{s.Notes}</span>}
                    <span className="text-slate-400">{s.SessionDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= PROFILE TAB ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">

            {/* Personal Info */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300">
                  <User size={18} /> Personal Information
                </h2>
                {!editing ? (
                  <button onClick={startEditing} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs">
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={cancelEditing} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-xs">Cancel</button>
                    <button onClick={saveProfile} disabled={saving} className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold transition-colors text-xs">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              {saveError && <p className="text-red-400 text-xs mb-4">{saveError}</p>}
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
                    <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Last Name</label>
                    <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Date of Birth</label>
                    <input type="date" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.dateOfBirth ?? ''} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Sex</label>
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Height (inches)</label>
                    <input type="number" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.height} onChange={e => setForm({ ...form, height: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Weight (lbs)</label>
                    <input type="number" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Sport</label>
                    <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.sportPlayed} onChange={e => setForm({ ...form, sportPlayed: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-400 text-xs">Team</label>
                    <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-slate-400 text-xs">Hours Working Out / Week</label>
                    <input type="number" step="0.5" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500" value={form.hoursSpentWorkingOut} onChange={e => setForm({ ...form, hoursSpentWorkingOut: Number(e.target.value) })} />
                  </div>
                </div>
              )}
            </section>

            {/* My Coaches */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-5">
                <ShieldCheck size={18} /> My Coaches
              </h2>
              <div className="mb-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Invite New Coach</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coach username..."
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
                {showInviteSuccess && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={14} /> Coach invited!
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block px-1">Active Coaches</label>
                {!data.coaches || data.coaches.length === 0 ? (
                  <p className="text-slate-500 text-sm italic px-1">No coaches assigned.</p>
                ) : (
                  data.coaches.map(coach => (
                    <div key={coach.PersonID} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
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
                <Settings size={18} /> Settings
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <div>
                    <p className="font-medium">Account</p>
                    <p className="text-slate-400 text-xs mt-0.5">Manage your login credentials</p>
                  </div>
                  <button
                    onClick={() => { setShowPasswordModal(true); setPasswordError(''); setPasswordSuccess(false); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs"
                  >
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
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" placeholder="Current password" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" placeholder="New password (min. 6 chars)" />
              </div>
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
              {passwordSuccess && <p className="text-emerald-400 text-xs">Password updated!</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={savingPassword} className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold transition-colors text-sm">
                  {savingPassword ? 'Saving…' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";
import { useRouter } from 'next/navigation';
import {
  Activity, AlertTriangle, CalendarDays, ChevronDown, Dumbbell, LogOut,
  Settings, ShieldCheck, Target, TrendingUp, User, CheckCircle2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import BodyMapDisplay from '../components/BodyMapDisplay';
import SearchBar from '../components/SearchBar';
import workoutData from '@/data/workouts.json';
import { useEffect, useState, useMemo } from 'react';

// map for current presets to their names and the nodes they target (add more in the future as needed)
const PRESETS_MAP: Record<string, { name: string, nodes: string[] }> = {
    'upper-body': { name: 'Upper Body Power', nodes: ['Pectorals / Shoulders', 'Mid-Back / Lats', 'Neck / Traps'] },
    'lower-body': { name: 'Lower Body Strength', nodes: ['Quadriceps / Hamstrings', 'Calves / Ankles'] },
    'core-stability': { name: 'Core Stability & Flow', nodes: ['Abs / Obliques'] }
};

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
    Duration: number;
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

type SorenessHistoryRow = {
  ReportDate: string;
  BodyPartName: string;
  Side: string;
  SorenessLevel: number;
};

type SessionHistoryRow = { SessionDate: string; WorkoutName: string; Duration: number; Notes: string };

type JournalEntry = { NoteID: number; NoteDate: string; NoteText: string };
type CoachNote = { NoteID: number; NoteDate: string; NoteText: string; CoachFirstName: string; CoachLastName: string };

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

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

  // Soreness history state
  const [sorenessHistory, setSorenessHistory] = useState<SorenessHistoryRow[]>([]);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const toggleLine = (region: string) => {
    setHiddenLines(prev => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  };

  // Coach notes (read-only)
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);
  const [coachNotesOpen, setCoachNotesOpen] = useState(true);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // Journal (general notes) state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalText, setJournalText] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Session history + calendar state
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRow[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [calendarOffset, setCalendarOffset] = useState(0);

    // NEW: Track selected workouts for the Active Workout session
    const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());

    // NEW: Track the preset selected from the WorkoutPresets page
    const [activePreset, setActivePreset] = useState<string | null>(null);

    // NEW: Track exercises explicitly removed from the active preset due to soreness
    const [removedPresetExercises, setRemovedPresetExercises] = useState<Set<string>>(new Set());


    const toggleSelectedWorkout = (workoutName: string) => {
        setSelectedWorkouts(prev => {
            const next = new Set(prev);
            if (next.has(workoutName)) next.delete(workoutName);
            else next.add(workoutName);
            return next;
        });
    };
    // NEW: Check for a selected preset when the dashboard loads
    useEffect(() => {
        const savedPreset = localStorage.getItem('selectedPreset');
        if (savedPreset) {
            setActivePreset(savedPreset);
        }
    }, []);
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
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch('/api/exercises')
      .then(r => r.ok ? r.json() : { exercises: [] })
      .then(d => {
        setExercises(d.exercises ?? []);
        if (d.exercises?.length > 0) setWorkoutId(d.exercises[0].ExerciseID);
      })
      .catch(console.error);

    fetch(`/api/player/${session.personId}/soreness-history`)
      .then(r => r.json())
      .then(d => setSorenessHistory(d.history ?? []))
      .catch(console.error);

    fetch(`/api/player/${session.personId}/session-history`)
      .then(r => r.json())
      .then(d => setSessionHistory(d.sessions ?? []))
      .catch(console.error);

    fetch('/api/notes')
      .then(r => r.ok ? r.json() : { notes: [] })
      .then(d => setJournalEntries(d.notes ?? []))
      .catch(console.error);

    fetch('/api/coach-notes')
      .then(r => r.ok ? r.json() : { notes: [] })
      .then(d => setCoachNotes(d.notes ?? []))
      .catch(console.error);
  }, [router]);

  // ================= JOURNAL CRUD =================
  const addJournalEntry = async () => {
    if (!journalText.trim()) return;
    setSavingJournal(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: journalText.trim() }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setJournalEntries(prev => [d.note, ...prev]);
      setJournalText('');
    } catch {
      alert('Failed to save note.');
    } finally {
      setSavingJournal(false);
    }
  };

  const saveEditedNote = async (noteId: number) => {
    if (!editingNoteText.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, text: editingNoteText.trim() }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setJournalEntries(prev => prev.map(e => e.NoteID === noteId ? d.note : e));
      setEditingNoteId(null);
      setEditingNoteText('');
    } catch {
      alert('Failed to save edit.');
    }
  };

  const deleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      if (!res.ok) throw new Error();
      setJournalEntries(prev => prev.filter(e => e.NoteID !== noteId));
    } catch {
      alert('Failed to delete note.');
    }
  };
    // 1. Calculate all exercises included in the current preset
    const presetEx = useMemo(() => {
        if (!activePreset || typeof PRESETS_MAP === 'undefined' || !PRESETS_MAP[activePreset]) return [];
        const nodes = PRESETS_MAP[activePreset].nodes;
        return workoutData.exercises
            .filter((ex: any) => nodes.some(node => ex.primary_nodes?.includes(node)))
            .map((ex: any) => ex.name || ex.Name);
    }, [activePreset]);

    // 2. Filter out the ones the user explicitly removed
    const activePresetExercises = presetEx.filter(ex => !removedPresetExercises.has(ex));

    // 3. Combine remaining preset exercises with manually added ones
    const combinedWorkouts = Array.from(new Set([...activePresetExercises, ...Array.from(selectedWorkouts)]));

    // 4. Shared sore parts (Muscles with level 5+ soreness)
    const soreParts = useMemo(() => {
        if (!data?.sorenessEntries) return [];

        // Maps the BodyMap UI names to your workouts.json target names
        const muscleAliases: Record<string, string> = {
            'chest': 'pectoral',
            'shoulders': 'deltoid',
            'abs': 'oblique',
            'upper back': 'lat',
            'glutes': 'gluteal'
        };

        return data.sorenessEntries
            .filter(e => e.SorenessLevel >= 5)
            .flatMap(e => {
                // Get the raw name (e.g., "chest")
                const rawName = e.BodyPartName.toLowerCase().replace(/s$/, '');
                // Find the alias (e.g., "pectoral")
                const alias = muscleAliases[rawName];

                return alias ? [rawName, alias] : [rawName];
            });
    }, [data?.sorenessEntries]);

    // 5. Generate dynamic removal recommendations
    const removalRecommendations = useMemo(() => {
        const recs: { workoutName: string, reason: string }[] = [];
        combinedWorkouts.forEach(workoutName => {
            const exDetail = workoutData.exercises.find((ex: any) => (ex.name || ex.Name) === workoutName);
            if (exDetail) {
                const targets = [
                    ...(exDetail.primary_nodes || []),
                    exDetail.TargetMuscle
                ].filter(Boolean).map((s: string) => s.toLowerCase());

                const matchingSorePart = soreParts.find(sore =>
                    targets.some(t => t.includes(sore) || sore.includes(t))
                );

                if (matchingSorePart) {
                    recs.push({ workoutName, reason: matchingSorePart });
                }
            }
        });
        return recs;
    }, [combinedWorkouts, soreParts]);

    // 6. NEW: Generate SMART Add Recommendations from your JSON
    const smartAddRecommendations = useMemo(() => {
        // Filter out exercises that are already staged OR hit a sore muscle
        const safeExercises = workoutData.exercises.filter((ex: any) => {
            // Already staged? Skip it.
            if (combinedWorkouts.includes(ex.name || ex.Name)) return false;

            // Hits a sore muscle? Skip it.
            const targets = [
                ...(ex.primary_nodes || []),
                ex.TargetMuscle
            ].filter(Boolean).map((s: string) => s.toLowerCase());

            const hitsSoreMuscle = soreParts.some(sore =>
                targets.some(t => t.includes(sore) || sore.includes(t))
            );

            return !hitsSoreMuscle;
        });

        // Pick the first 3 safe exercises and format them for the UI
        return safeExercises.slice(0, 3).map((ex: any) => ({
            WorkoutName: ex.name || ex.Name,
            BodyPartName: ex.primary_nodes?.[0] || ex.TargetMuscle || 'General',
            Reps: ex.reps || 10,       // Fallback to 10 if your JSON lacks reps
            Duration: ex.duration || 15 // Fallback to 15 if your JSON lacks duration
        }));
    }, [combinedWorkouts, soreParts]);
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

    // Rename sessions to rawSessions so we can parse them below
    const { player, latestReport, sorenessEntries, workoutSuggestions, sessions: rawSessions } = data;
    const atRisk = (latestReport?.InjuryRiskScore ?? 0) > 0;

    // --- NEW: Parse the real name and duration from our custom notes ---
    const parseCustomSession = (s: any) => {
        let parsedName = s.WorkoutName;
        let parsedDuration = s.Duration;
        let parsedNotes = s.Notes;

        // If the notes start with a bracket, intercept it!
        if (s.Notes && s.Notes.startsWith('[')) {
            const endBracket = s.Notes.indexOf(']');
            if (endBracket !== -1) {
                const header = s.Notes.substring(1, endBracket); // e.g., "Upper Body Protocol - 1 min"
                const parts = header.split(' - ');
                if (parts.length === 2) {
                    parsedName = parts[0]; // "Upper Body Protocol"
                    parsedDuration = parseInt(parts[1].replace(/[^0-9]/g, '')) || s.Duration; // Extracts the "1"
                }
                // Strip the bracket header out of the notes so it doesn't render twice on the UI
                parsedNotes = s.Notes.substring(endBracket + 1).trim();
            }
        }
        return { ...s, WorkoutName: parsedName, Duration: parsedDuration, Notes: parsedNotes };
    };

    // Apply the parser to both the recent sessions AND the calendar history
    const sessions = rawSessions.map(parseCustomSession);
    const parsedSessionHistory = sessionHistory.map(parseCustomSession);
    // -------------------------------------------------------------------

  // ── Soreness history chart data ──
  const REGION_COLORS = ['#06b6d4', '#f59e0b', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#fb923c'];
  const sorenessRegions = Array.from(
    new Set(sorenessHistory.map(r => r.Side !== 'N/A' ? `${r.BodyPartName} (${r.Side})` : r.BodyPartName))
  ).slice(0, 7);
  const sorenesDates = Array.from(new Set(sorenessHistory.map(r => r.ReportDate))).sort();
  const sorenessChartData = sorenesDates.map(date => {
    const point: Record<string, string | number> = { date };
    sorenessRegions.forEach(region => {
      const match = sorenessHistory.find(r => {
        const label = r.Side !== 'N/A' ? `${r.BodyPartName} (${r.Side})` : r.BodyPartName;
        return r.ReportDate === date && label === region;
      });
      if (match) point[region] = match.SorenessLevel;
    });
    return point;
  });

  // ── Recent sessions chart data ──
  const chartData = [...sessions].reverse().map(s => ({ day: s.SessionDate, workout: s.WorkoutName, duration: s.Duration }));

    // ── Calendar lookups ──
    // Use parsedSessionHistory instead of sessionHistory
    const sessionDateSet = new Set(parsedSessionHistory.map(s => s.SessionDate));
    const sessionsByDate: Record<string, SessionHistoryRow[]> = {};
    parsedSessionHistory.forEach(s => {
        if (!sessionsByDate[s.SessionDate]) sessionsByDate[s.SessionDate] = [];
        sessionsByDate[s.SessionDate].push(s);
    });
  const sorenessHistoryByDate: Record<string, SorenessHistoryRow[]> = {};
  sorenessHistory.forEach(r => {
    if (!sorenessHistoryByDate[r.ReportDate]) sorenessHistoryByDate[r.ReportDate] = [];
    sorenessHistoryByDate[r.ReportDate].push(r);
  });

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'workout',  label: 'Workout',           icon: <Dumbbell size={16} /> },
    { id: 'soreness', label: 'Soreness',           icon: <Activity size={16} /> },
    { id: 'history',  label: 'History',            icon: <CalendarDays size={16} /> },
    { id: 'profile',  label: 'Profile & Settings', icon: <User size={16} /> },
  ];

  // suppress unused warning — calcAge is available for use in profile display if needed
  void calcAge;

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
            <div className="hidden md:block w-64"><SearchBar /></div>

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

                      {/* Customize Workout */}
                      <section className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div>
                              <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                                  <Settings size={18} />
                                  Customize Your Workout
                              </h2>
                              <p className="text-slate-400 text-sm mt-1">Create or modify your own workout presets.</p>
                          </div>
                          <button
                              onClick={() => router.push('/workout-presets')}
                              className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-colors"
                          >
                              Go to Presets
                          </button>
                      </section>

                      {/* Workout Recommendations */}
                      <section>
                          <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-4">
                              <Dumbbell size={18} />
                              Workout Recommendations
                              <span className="text-xs text-slate-500 font-normal ml-1">Based on your check-in</span>
                          </h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {/* Dynamic REMOVAL Recommendations (Red Cards) */}
                              {removalRecommendations.map(rec => (
                                  <div key={rec.workoutName} className="rounded-xl border border-red-800/50 bg-red-950/20 p-5 transition-colors">
                                      <div className="flex items-center justify-between mb-3">
                                          <h3 className="font-semibold text-red-200">{rec.workoutName}</h3>
                                          <span className="px-2 py-0.5 rounded-full text-xs border bg-red-500/15 text-red-300 border-red-500/40 capitalize">
                                              {rec.reason} Soreness
                                          </span>
                                      </div>
                                      <p className="text-slate-400 text-sm mb-4">High soreness detected. Recommended to remove from today's routine.</p>
                                      <button
                                          onClick={() => {
                                              // 1. Remove from manual selections if it's there
                                              if (selectedWorkouts.has(rec.workoutName)) {
                                                  toggleSelectedWorkout(rec.workoutName);
                                              }
                                              // 2. Mark as removed from preset if it came from the protocol
                                              if (presetEx.includes(rec.workoutName)) {
                                                  setRemovedPresetExercises(prev => new Set(prev).add(rec.workoutName));
                                              }
                                          }}
                                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-2.5 transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                      >
                                          - Remove from Routine
                                      </button>
                                  </div>
                              ))}

                              {/* Standard ADD Recommendations (Now 100% dynamic and injury-safe) */}
                              {smartAddRecommendations.length === 0 && removalRecommendations.length === 0 ? (
                                  <p className="text-slate-500 text-sm col-span-3">No safe recommendations available based on current soreness.</p>
                              ) : smartAddRecommendations.map((item) => (
                                  <div key={item.WorkoutName} className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors">
                                      <div className="flex items-center justify-between mb-3">
                                          <h3 className="font-semibold">{item.WorkoutName}</h3>
                                          <span className="px-2 py-0.5 rounded-full text-xs border bg-cyan-500/15 text-cyan-300 border-cyan-500/40">
                                              {item.BodyPartName}
                                          </span>
                                      </div>
                                      <p className="text-slate-400 text-sm mb-4">{item.Reps} reps · {item.Duration} min</p>
                                      <button
                                          onClick={() => toggleSelectedWorkout(item.WorkoutName)}
                                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-2.5 transition-colors bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                                      >
                                          + Add to Routine
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </section>

                      {/* Current Workout Staging Area */}
                      <section className="mt-8">
                          <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-4">
                              <Target size={18} />
                              Current Workout Plan
                          </h2>

                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                              {combinedWorkouts.length === 0 && !activePreset ? (
                                  <p className="text-slate-500 text-sm">No workouts or protocols added yet. Add some from above to get started.</p>
                              ) : (
                                  <div className="space-y-3">
                                      {/* Show the Preset and its exercises if added */}
                                      {activePreset && PRESETS_MAP[activePreset] && (
                                          <div className="bg-slate-950 p-4 rounded-lg border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                              <div className="flex items-center justify-between mb-2">
                                                  <div>
                                                      <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">Active Protocol</span>
                                                      <span className="font-semibold text-white">{PRESETS_MAP[activePreset].name}</span>
                                                  </div>
                                                  <button
                                                      onClick={() => {
                                                          setActivePreset(null);
                                                          localStorage.removeItem('selectedPreset');
                                                          setRemovedPresetExercises(new Set()); // Reset removals when protocol is dropped
                                                      }}
                                                      className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded hover:bg-red-400/10 transition-colors"
                                                  >
                                                      Remove Protocol
                                                  </button>
                                              </div>

                                              {presetEx.length > 0 && (
                                                  <div className="mt-4 pt-3 border-t border-slate-800/50">
                                                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-2">Included Exercises</p>
                                                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                          {presetEx.map((exName: string, idx: number) => {
                                                              const isRemoved = removedPresetExercises.has(exName);
                                                              return (
                                                                  <li key={idx} className={`text-sm flex items-center gap-2 ${isRemoved ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                                                                      <span className={`w-1 h-1 rounded-full ${isRemoved ? 'bg-slate-700' : 'bg-cyan-500/50'}`} />
                                                                      {exName}
                                                                      {isRemoved && <span className="text-[10px] text-red-500 ml-auto no-underline tracking-wider uppercase font-bold">Removed</span>}
                                                                  </li>
                                                              );
                                                          })}
                                                      </ul>
                                                  </div>
                                              )}
                                          </div>
                                      )}

                                      {/* Show individual manually selected workouts */}
                                      {Array.from(selectedWorkouts).map(workout => (
                                          <div key={workout} className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                              <span className="font-medium text-slate-200">{workout}</span>
                                              <button
                                                  onClick={() => toggleSelectedWorkout(workout)}
                                                  className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded hover:bg-red-400/10 transition-colors"
                                              >
                                                  Remove
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {/* Start Active Workout Button */}
                              {combinedWorkouts.length > 0 && (
                                  <div className="mt-6 flex justify-end border-t border-slate-800/60 pt-5">
                                      <button
                                          onClick={() => {
                                              // Pass ONLY the combined/filtered workouts to the active page
                                              localStorage.setItem('selectedActiveWorkouts', JSON.stringify(combinedWorkouts));
                                              router.push('/active-workout');
                                          }}
                                          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                                      >
                                          <Target size={20} />
                                          Start Workout
                                      </button>
                                  </div>
                              )}
                          </div>
                      </section>
            {/* Recent Sessions */}
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
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={32} unit=" min" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#06b6d4' }}
                          formatter={(value, _name, props) => [
                            `${value} min`,
                            (props.payload as { workout?: string } | undefined)?.workout ?? 'Duration',
                          ]}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Line type="monotone" dataKey="duration" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                                      {/* --- NEW: Most Recent Session Featured Card --- */}
                                      <div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                                          <div className="flex items-start justify-between mb-4 border-b border-cyan-500/20 pb-4">
                                              <div>
                                                  <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                      <CheckCircle2 size={12} /> Latest Workout
                                                  </p>
                                                  <h3 className="text-xl font-bold text-white">{sessions[0].WorkoutName}</h3>
                                              </div>
                                              <div className="text-right">
                                                  <span className="inline-block bg-cyan-500 text-black font-bold px-3 py-1 rounded-lg text-sm mb-1 shadow-lg shadow-cyan-500/20">
                                                      {sessions[0].Duration} min
                                                  </span>
                                                  <p className="text-xs text-slate-400 font-medium">{sessions[0].SessionDate}</p>
                                              </div>
                                          </div>

                                          {/* The Formatted Notes / Receipt */}
                                          {sessions[0].Notes ? (
                                              <div className="bg-[#0f172a] p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                  {sessions[0].Notes}
                                              </div>
                                          ) : (
                                              <p className="text-sm text-slate-500 italic">No detailed breakdown logged.</p>
                                          )}
                                      </div>

                                      {/* --- OLDER SESSIONS --- */}
                                      {sessions.length > 1 && (
                                          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 pt-1">Previous History</p>
                                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                  {sessions.slice(1).map((s, i) => (
                                                      <div key={i} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm transition-colors hover:border-slate-600">
                                                          <div className="flex items-center justify-between mb-1">
                                                              <span className="font-bold text-slate-300">{s.WorkoutName}</span>
                                                              <span className="text-slate-500 text-xs font-medium">{s.SessionDate} &middot; {s.Duration} min</span>
                                                          </div>

                                                          {/* Optional: Show notes for older ones too, but smaller */}
                                                          {s.Notes && (
                                                              <p className="text-slate-500 text-[10px] mt-1 whitespace-pre-wrap font-mono line-clamp-2">
                                                                  {s.Notes}
                                                              </p>
                                                          )}
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                </>
              )}
            </section>

            {/* Coach Notes (read-only, collapsible) */}
            {coachNotes.length > 0 && (
              <section>
                <button
                  onClick={() => setCoachNotesOpen(o => !o)}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300">
                    Coach Notes
                    <span className="text-xs font-normal text-slate-500 ml-1">({coachNotes.length})</span>
                  </h2>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${coachNotesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {coachNotesOpen && (
                  <div className="space-y-3">
                    {coachNotes.map(note => (
                      <div key={note.NoteID} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                        <p className="text-xs text-slate-500 mb-1">
                          {note.CoachFirstName} {note.CoachLastName} &middot; {note.NoteDate}
                        </p>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.NoteText}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Notes */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300">
                  <CalendarDays size={18} />
                  Notes
                </h2>
                <button
                  onClick={() => setNoteModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-colors"
                >
                  + Add Note
                </button>
              </div>

              {/* Add Note Modal */}
              {noteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                    <h3 className="text-base font-semibold text-cyan-300 mb-4">New Note</h3>
                    <textarea
                      value={journalText}
                      onChange={e => setJournalText(e.target.value)}
                      placeholder="How are you feeling? Recovery notes, goals, observations…"
                      rows={5}
                      autoFocus
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => { setNoteModalOpen(false); setJournalText(''); }}
                        className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => { await addJournalEntry(); setNoteModalOpen(false); }}
                        disabled={savingJournal || !journalText.trim()}
                        className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors"
                      >
                        {savingJournal ? 'Saving…' : 'Save Note'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {journalEntries.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {journalEntries.map(entry => (
                    <div key={entry.NoteID} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500">{entry.NoteDate}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingNoteId(entry.NoteID); setEditingNoteText(entry.NoteText); }}
                            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteNote(entry.NoteID)}
                            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {editingNoteId === entry.NoteID ? (
                        <div>
                          <textarea
                            value={editingNoteText}
                            onChange={e => setEditingNoteText(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500 mt-1"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEditedNote(entry.NoteID)}
                              disabled={!editingNoteText.trim()}
                              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{entry.NoteText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ══ SORENESS TAB ══ */}
        {activeTab === 'soreness' && (
          <div className="space-y-6">

            {/* Sub-tab header */}
            <div className="flex items-center justify-end">
              <a href="/check-in" className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-colors">
                Update Check-In
              </a>
            </div>

            {/* Current soreness */}
            <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  From your most recent check-in{latestReport ? ` on ${latestReport.ReportDate}` : ''}
                </p>
                {sorenessEntries.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
                    <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No soreness recorded yet</p>
                    <p className="text-slate-500 text-sm mt-1">Complete a check-in to see your soreness data here.</p>
                  </div>
                ) : (
                  <>
                    <BodyMapDisplay sorenessRows={sorenessEntries} sex={player.Sex} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
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
</>
                )}
            </div>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}
        {activeTab === 'history' && (() => {
          const today = new Date();
          const todayStr = today.toISOString().slice(0, 10);
          const isCurrentMonth = calendarOffset === 0;

          const visibleMonths = [1, 0].map(extra => {
            const d = new Date(today.getFullYear(), today.getMonth() - calendarOffset - extra, 1);
            return { year: d.getFullYear(), monthIdx: d.getMonth() };
          });
          const newerMonth = visibleMonths[1];

          const selectedSessions = selectedCalendarDate ? (sessionsByDate[selectedCalendarDate] ?? []) : [];
          const selectedSoreness = selectedCalendarDate ? (sorenessHistoryByDate[selectedCalendarDate] ?? []) : [];

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-300">History</h2>
                  <p className="text-slate-400 text-sm">
                    {MONTH_NAMES[visibleMonths[0].monthIdx]} {visibleMonths[0].year}
                    {' – '}
                    {MONTH_NAMES[newerMonth.monthIdx]} {newerMonth.year}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex flex-col gap-4 w-2/3">

                  {/* Navigation controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={newerMonth.monthIdx}
                      onChange={e => {
                        const targetMonth = Number(e.target.value);
                        const diff = (today.getFullYear() - newerMonth.year) * 12 + (today.getMonth() - targetMonth);
                        setCalendarOffset(Math.max(0, diff));
                        setSelectedCalendarDate(null);
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                    >
                      {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                      value={newerMonth.year}
                      onChange={e => {
                        const targetYear = Number(e.target.value);
                        const diff = (targetYear - today.getFullYear()) * -12 + (today.getMonth() - newerMonth.monthIdx);
                        setCalendarOffset(Math.max(0, diff));
                        setSelectedCalendarDate(null);
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <div className="w-px h-5 bg-slate-700" />
                    <button
                      onClick={() => { setCalendarOffset(o => o + 1); setSelectedCalendarDate(null); }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => { setCalendarOffset(o => Math.max(0, o - 1)); setSelectedCalendarDate(null); }}
                      disabled={isCurrentMonth}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                    <button
                      onClick={() => { setCalendarOffset(0); setSelectedCalendarDate(null); }}
                      disabled={isCurrentMonth}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Today
                    </button>
                  </div>

                  {/* Two-month grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleMonths.map(({ year, monthIdx }) => {
                      const firstDay = new Date(year, monthIdx, 1).getDay();
                      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                      const cells: (number | null)[] = [
                        ...Array(firstDay).fill(null),
                        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                      ];
                      return (
                        <div key={`${year}-${monthIdx}`} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-sm font-semibold text-slate-300 mb-3">
                            {MONTH_NAMES[monthIdx]} <span className="text-slate-500 font-normal">{year}</span>
                          </p>
                          <div className="grid grid-cols-7 gap-0.5 text-center">
                            {DAY_LABELS.map(d => (
                              <div key={d} className="text-slate-600 text-[10px] pb-1">{d}</div>
                            ))}
                            {cells.map((day, ci) => {
                              if (!day) return <div key={ci} />;
                              const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const hasSession = sessionDateSet.has(dateStr);
                              const isToday = dateStr === todayStr;
                              const isSelected = dateStr === selectedCalendarDate;
                              const daySoreness = sorenessHistoryByDate[dateStr];
                              const maxSoreness = daySoreness ? Math.max(...daySoreness.map(r => r.SorenessLevel)) : 0;
                              const sorenessColor = maxSoreness >= 7 ? 'bg-red-500' : maxSoreness >= 4 ? 'bg-yellow-400' : maxSoreness > 0 ? 'bg-green-400' : '';
                              return (
                                <button
                                  key={ci}
                                  onClick={() => setSelectedCalendarDate(isSelected ? null : dateStr)}
                                  className={`relative flex flex-col items-center justify-center rounded text-[11px] h-7 w-full transition-colors
                                    ${isSelected ? 'ring-2 ring-white' : isToday ? 'ring-1 ring-cyan-500' : ''}
                                    ${hasSession
                                      ? 'bg-cyan-500 text-black font-semibold hover:bg-cyan-400'
                                      : 'text-slate-500 hover:bg-slate-800'
                                    }`}
                                >
                                  <span className="leading-none relative -top-[3px]">{day}</span>
                                  {maxSoreness > 0 && (
                                    <span className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ring-1 ring-black/60 ${sorenessColor}`} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-slate-500 text-xs text-center">
                    {!selectedCalendarDate
                      ? 'Select a day to view details'
                      : selectedSoreness.length === 0
                      ? 'No soreness logged for this day'
                      : null}
                  </p>
                </div>

                {/* Body map beside calendars */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide text-center w-full">Soreness Map</p>
                  <BodyMapDisplay sorenessRows={selectedSoreness} sex={player.Sex} scale={0.85} />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-cyan-500" /> Session logged</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded ring-1 ring-cyan-500" /> Today</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded ring-2 ring-white" /> Selected</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-green-400" /> Low soreness (1–3)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" /> Moderate (4–6)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> High soreness (7–10)</span>
              </div>

              {/* Day detail panel */}
              {selectedCalendarDate && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-200">{selectedCalendarDate}</h3>
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-6">
                    <div>
                      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2">Workouts</p>
                                  {selectedSessions.length === 0 ? (
                                      <p className="text-slate-500 text-sm">No sessions logged</p>
                                  ) : (
                                      <ul className="space-y-3">
                                          {selectedSessions.map((s, i) => (
                                              <li key={i} className="text-sm bg-slate-950/50 border border-slate-800/60 p-3 rounded-xl">
                                                  <div className="flex justify-between items-center mb-1">
                                                      <span className="font-bold text-cyan-300">{s.WorkoutName}</span>
                                                      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{s.Duration} min</span>
                                                  </div>

                                                  {/* NEW: Format the notes here too! */}
                                                  {s.Notes && (
                                                      <p className="text-slate-400 text-[11px] mt-2 whitespace-pre-wrap font-mono bg-[#0f172a] p-2.5 rounded-lg border border-slate-800">
                                                          {s.Notes}
                                                      </p>
                                                  )}
                                              </li>
                                          ))}
                                      </ul>
                                  )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-2">Soreness</p>
                      {selectedSoreness.length === 0 ? (
                        <p className="text-slate-500 text-sm">No soreness logged</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {selectedSoreness.map((r, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300">{r.BodyPartName}{r.Side && r.Side !== 'N/A' ? ` (${r.Side})` : ''}</span>
                              <span className={`ml-3 font-semibold tabular-nums ${
                                r.SorenessLevel >= 7 ? 'text-red-400' :
                                r.SorenessLevel >= 4 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>{r.SorenessLevel}/10</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Soreness trend chart */}
              <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-3">
                  <TrendingUp size={18} />
                  Soreness Trends
                  <span className="text-xs text-slate-500 font-normal ml-1">Last 30 days</span>
                </h2>
                {sorenessHistory.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
                    <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No history yet</p>
                    <p className="text-slate-500 text-sm mt-1">Complete multiple check-ins to see trends over time.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    {/* Custom clickable legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                      {sorenessRegions.map((region, i) => {
                        const color = REGION_COLORS[i % REGION_COLORS.length];
                        const hidden = hiddenLines.has(region);
                        return (
                          <button
                            key={region}
                            onClick={() => toggleLine(region)}
                            className="flex items-center gap-1.5 text-xs transition-opacity"
                            style={{ opacity: hidden ? 0.35 : 1 }}
                          >
                            <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
                            <span style={{ color: hidden ? '#64748b' : '#e2e8f0' }}>{region}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sorenessChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={24} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                        />
                        {sorenessRegions.map((region, i) => (
                          <Line
                            key={region}
                            type="monotone"
                            dataKey={region}
                            stroke={REGION_COLORS[i % REGION_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            connectNulls
                            hide={hiddenLines.has(region)}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </section>

            </div>
          );
        })()}

        {/* ══ PROFILE & SETTINGS TAB ══ */}
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
                {showInviteSuccess && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={14} /> Coach invited!
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block px-1">Active Coaches</label>
                {!data.coaches || data.coaches.length === 0 ? (
                  <p className="text-slate-500 text-sm italic px-1">No coaches assigned to your profile.</p>
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

      {/* ══ CHANGE PASSWORD MODAL ══ */}
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

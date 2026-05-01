"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  ArrowRight, 
  LogOut, 
  Settings, 
  Plus, 
  UserMinus, 
  ChevronLeft,
  ClipboardList } from 'lucide-react';
import RestrictWorkouts from '../components/RestrictWorkouts';
import { WorkoutSuggestionCard, AddToTrainingPlanModal, JsonWorkout } from '../components/TrainingPlanModal';
import workoutsData from '@/data/workouts.json';

type Athlete = {
  PersonID: number;
  FirstName: string;
  LastName: string;
  SportPlayed: string;
  Team: string;
  Sex: string;
  Height: number;
  Weight: number;
  HoursSpentWorkingOut: number;
  ProgressScore: number | null;
  InjuryRiskScore: number | null;
  ReportDate: string | null;
};

type PlayerDetail = {
  player: {
    PersonID: number;
    FirstName: string;
    LastName: string;
    SportPlayed: string;
    Team: string;
    Sex: string;
    Height: number;
    Weight: number;
  };
  latestReport: { ProgressScore: number; InjuryRiskScore: number; ReportDate: string } | null;
  sorenessEntries: { BodyPartName: string; Side: string; SorenessLevel: number }[];
  workoutSuggestions: { WorkoutName: string; Duration: number; Reps: number; BodyPartName: string }[];
  selectedPreset: string | null;
};

type CoachNote = { NoteID: number; NoteDate: string; NoteText: string };


/* --- MODAL COMPONENT --- */
const ManageRosterModal = ({ 
  isOpen, 
  onClose, 
  athletes, 
  onRemove, 
  onInvite 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  athletes: Athlete[]; 
  onRemove: (id: number) => void;
  onInvite: (emailOrUser: string) => void;
}) => {
  const [inviteValue, setInviteValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#160e06] border border-amber-800/50 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="text-amber-400" size={20} />
            Manage Roster
          </h2>
          <button onClick={onClose} className="text-yellow-50/70 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Invite Section */}
        <div className="p-6 border-b border-amber-800/50 bg-[#0f0804]/80">
          <label className="text-xs font-bold text-yellow-50/70 uppercase tracking-widest mb-2 block">
            Invite New Athlete
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Username or Email..." 
              value={inviteValue}
              onChange={(e) => setInviteValue(e.target.value)}
              className="flex-1 bg-[#221408] border border-amber-800/60 rounded-lg px-4 py-2 text-sm text-yellow-50 focus:outline-none focus:border-amber-500"
            />
            <button 
              onClick={() => { onInvite(inviteValue); setInviteValue(''); }}
              className="bg-amber-600 hover:bg-amber-500 text-black p-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Athlete List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <label className="text-xs font-bold text-yellow-50/70 uppercase tracking-widest px-2 mb-2 block">
            Current Athletes ({athletes.length})
          </label>
          {athletes.map(athlete => (
            <div key={athlete.PersonID} className="flex items-center justify-between p-3 rounded-xl bg-[#221408]/60 border border-amber-900/40 group hover:border-red-500/50 transition-colors">
              <span className="text-sm font-medium">{athlete.FirstName} {athlete.LastName}</span>
              <button 
                onClick={() => onRemove(athlete.PersonID)}
                className="text-yellow-50/70 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                title="Remove from roster"
              >
                <UserMinus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function CoachDashboard() {
  const router = useRouter();
  const [roster, setRoster] = useState<Athlete[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isManagingRoster, setIsManagingRoster] = useState(false);
  const [coachPersonId, setCoachPersonId] = useState<number | null>(null);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const allJsonWorkouts = workoutsData.exercises as JsonWorkout[];

  const logout = async () => {
    localStorage.removeItem('session');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [coachName, setCoachName] = useState('');
  

  // Coach notes state
  const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);
  const [coachNoteText, setCoachNoteText] = useState('');
  const [savingCoachNote, setSavingCoachNote] = useState(false);
  const [editingCoachNoteId, setEditingCoachNoteId] = useState<number | null>(null);
  const [editingCoachNoteText, setEditingCoachNoteText] = useState('');

  // Load roster on mount using session coachId
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(session => {
        if (!session) { router.push('/login'); return; }
        setCoachName(`${session.firstName} ${session.lastName}`);
        setCoachPersonId(session.personId);
        return fetch(`/api/coach/athletes?coachId=${session.personId}`)
          .then(r => r.json())
          .then(data => setRoster(data.athletes ?? []))
          .catch(console.error);
      });
  }, [router]);

  // Load individual athlete detail when selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); setCoachNotes([]); return; }
    setLoadingDetail(true);
    setCoachNotes([]);
    setCoachNoteText('');
    setEditingCoachNoteId(null);
    Promise.all([
      fetch(`/api/player/${selectedId}`).then(r => r.json()),
      fetch(`/api/coach-notes?athleteId=${selectedId}`).then(r => r.ok ? r.json() : { notes: [] }),
    ])
      .then(([playerData, notesData]) => {
        setDetail(playerData);
        setCoachNotes(notesData.notes ?? []);
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const activeAthlete = roster.find(a => a.PersonID === selectedId);

  const handleRemoveAthlete = async (athleteId: number) => {
    if (!confirm("Are you sure you want to remove this athlete?")) return;

    try {
      const response = await fetch('/api/coach/remove-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });
      if (response.ok) {
        setRoster(prev => prev.filter(a => a.PersonID !== athleteId));
        if (selectedId === athleteId) setSelectedId(null);
      } else {
        const data = await response.json();
        alert(data.error ?? 'Failed to remove athlete');
      }
    } catch (err) {
      console.error("Failed to remove athlete", err);
    }
  };

  const handleInviteAthlete = async (identifier: string) => {
    if (!identifier) return;

    try {
      const response = await fetch('/api/coach/invite-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`${data.athleteName} added to your roster!`);
        // Refresh roster
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          const rosterRes = await fetch(`/api/coach/athletes?coachId=${session.personId}`);
          const rosterData = await rosterRes.json();
          setRoster(rosterData.athletes ?? []);
        }
      } else {
        alert(data.error ?? 'Failed to invite athlete');
      }
    } catch (err) {
      console.error("Failed to invite athlete", err);
    }
  };

  const addCoachNote = async () => {
    if (!coachNoteText.trim() || !selectedId) return;
    setSavingCoachNote(true);
    try {
      const res = await fetch('/api/coach-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: selectedId, text: coachNoteText.trim() }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCoachNotes(prev => [d.note, ...prev]);
      setCoachNoteText('');
    } catch {
      alert('Failed to save note.');
    } finally {
      setSavingCoachNote(false);
    }
  };

  const saveEditedCoachNote = async (noteId: number) => {
    if (!editingCoachNoteText.trim()) return;
    try {
      const res = await fetch('/api/coach-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, text: editingCoachNoteText.trim() }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCoachNotes(prev => prev.map(n => n.NoteID === noteId ? d.note : n));
      setEditingCoachNoteId(null);
      setEditingCoachNoteText('');
    } catch {
      alert('Failed to save edit.');
    }
  };

  const deleteCoachNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch('/api/coach-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      if (!res.ok) throw new Error();
      setCoachNotes(prev => prev.filter(n => n.NoteID !== noteId));
    } catch {
      alert('Failed to delete note.');
    }
  };


  return (
    <main className="min-h-screen bg-[#0f0804] text-white flex overflow-hidden">

      {/* --- LEFT PANEL: ROSTER --- */}
      <div className="w-1/3 border-r border-amber-900/40 bg-[#160e06]/80 flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-amber-400" />
              Team Roster
            </h1>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-yellow-50/70 hover:text-white transition-colors text-sm"
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <p className="text-yellow-50 text-sm mt-1">{coachName || 'Coach Dashboard'}</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {roster.length === 0 && (
            <p className="text-yellow-50/70 text-sm text-center mt-8">No athletes assigned</p>
          )}
          {roster.map((athlete) => {
            const atRisk = (athlete.InjuryRiskScore ?? 0) > 0;
            return (
              <div
                key={athlete.PersonID}
                onClick={() => setSelectedId(athlete.PersonID)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                  ${selectedId === athlete.PersonID
                    ? 'bg-[#321d08] border-amber-500 shadow-lg shadow-amber-700/50'
                    : 'bg-[#221408] border-amber-900/60 hover:border-amber-800'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${atRisk ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {athlete.FirstName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{athlete.FirstName} {athlete.LastName}</h3>
                    <p className="text-xs text-yellow-50 uppercase tracking-wider">{athlete.SportPlayed} · {athlete.Team}</p>
                  </div>
                </div>

                {atRisk ? (
                  <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle className="text-yellow-400/50 w-5 h-5" />
                )}
              </div>
            );
          })}
        </div>

      {/* --- NEW: MANAGE ROSTER BUTTON --- */}
        <div className="p-4 border-t border-amber-900/40 bg-[#160e06]/80">
            <button 
                onClick={() => setIsManagingRoster(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#221408] border border-amber-800/60 text-yellow-300 hover:bg-amber-700 hover:border-amber-600 hover:text-yellow-50 transition-all font-semibold"
            >
                <Settings size={18} />
                Manage Team Roster
            </button>
        </div>
      </div>

      <ManageRosterModal 
        isOpen={isManagingRoster}
        onClose={() => setIsManagingRoster(false)}
        athletes={roster}
        onRemove={handleRemoveAthlete}
        onInvite={handleInviteAthlete}
      />

      {/* --- RIGHT PANEL: COMMAND CENTER --- */}
      <div className="w-2/3 bg-[#0f0804]/90 p-10 flex flex-col h-screen overflow-y-auto">
        {loadingDetail ? (
          <div className="h-full flex items-center justify-center text-yellow-50/70">Loading…</div>
        ) : activeAthlete && detail ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">

            {/* Top Bar: Athlete Profile */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {detail.player.FirstName} {detail.player.LastName}
                </h2>
                <div className="flex gap-3">
                  <span className="px-3 py-1 bg-[#221408] border border-amber-900/50 rounded text-sm text-yellow-50">{detail.player.SportPlayed}</span>
                  <span className="px-3 py-1 bg-[#221408] border border-amber-900/50 rounded text-sm text-yellow-50">{detail.player.Team}</span>
                  <span className="px-3 py-1 bg-[#221408] border border-amber-900/50 rounded text-sm text-yellow-50">
                    {detail.player.Height}&quot; · {detail.player.Weight} lbs
                  </span>
                </div>
              </div>

              {/* Readiness Score */}
              <div className={`text-right ${(detail.latestReport?.InjuryRiskScore ?? 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                <div className="text-sm uppercase font-bold tracking-widest mb-1">Status</div>
                <div className="text-2xl font-black flex items-center justify-end gap-2">
                  {(detail.latestReport?.InjuryRiskScore ?? 0) > 0 ? 'MODIFICATION NEEDED' : 'CLEARED TO TRAIN'}
                  {(detail.latestReport?.InjuryRiskScore ?? 0) > 0 ? <AlertTriangle /> : <CheckCircle />}
                </div>
                {detail.latestReport && (
                  <div className="text-xs text-yellow-50 mt-1">
                    Progress: {detail.latestReport.ProgressScore} · Last check-in: {detail.latestReport.ReportDate}
                  </div>
                )}
              </div>
            </div>

            {/* THE SPLIT: Soreness + Workout */}
            <div className="grid grid-cols-2 gap-10">

              {/* 1. Soreness report */}
              <div className="bg-[#221408]/40 border border-amber-800/40 rounded-2xl p-6 relative overflow-hidden">
                <h3 className="text-yellow-50 text-sm uppercase font-bold mb-6">Soreness Report</h3>

                <div className="relative min-h-[200px] flex flex-col gap-3 bg-[#0f0804]/70 rounded-xl border border-amber-800/30 p-4">
                  {detail.sorenessEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-green-500">
                      <CheckCircle size={48} className="mb-2 opacity-50" />
                      <p>No soreness reported</p>
                    </div>
                  ) : (
                    detail.sorenessEntries.map((entry, i) => {
                      const color = entry.SorenessLevel >= 7 ? 'bg-red-500/20 border-red-500 text-red-400'
                        : entry.SorenessLevel >= 4 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-green-500/20 border-green-500 text-green-400';
                      return (
                        <div key={i} className={`flex justify-between items-center px-4 py-2 rounded-lg border ${color}`}>
                          <span className="font-bold">{entry.BodyPartName} {entry.Side !== 'N/A' ? `(${entry.Side})` : ''}</span>
                          <span className="font-mono">{entry.SorenessLevel}/10</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2. Workout suggestions */}
              <div className="bg-[#221408]/40 border border-amber-800/40 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-yellow-50 text-sm uppercase font-bold">Suggested Session Plan</h3>
                  <button
                    onClick={() => setShowAddWorkoutModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition-colors"
                  >
                    <Plus size={13} />
                    Add workout
                  </button>
                </div>
                <div className="space-y-4">
                  {allJsonWorkouts.slice(0, 3).map((w, idx) => (
                    <WorkoutSuggestionCard
                      key={idx}
                      workout={{
                        WorkoutName: w.name,
                        Duration: 20,
                        Reps: 15,
                        BodyPartName: w.primary_nodes.join(', '),
                      }}
                      athleteId={selectedId!}
                      allWorkouts={allJsonWorkouts}
                      onSuccess={undefined}
                    />
                  ))}
                </div>
              </div>
              {coachPersonId && selectedId && (
                <div className="mt-10">
                  <RestrictWorkouts
                    athleteId={selectedId}
                    coachId={coachPersonId}
                  />
                </div>
              )}

            </div>

            {/* Training Plan: Preset + Daily Suggestions */}
            <div className="mt-10 bg-[#221408]/40 border border-amber-800/40 rounded-2xl p-6">
              <h3 className="text-yellow-50 text-sm uppercase font-bold flex items-center gap-2 mb-5">
                <ClipboardList size={14} className="text-amber-400" />
                Training Plan
              </h3>

              {/* Selected preset badge */}
              <div className="mb-5">
                <p className="text-xs font-bold text-yellow-50/60 uppercase tracking-widest mb-2">Selected Protocol</p>
                {detail.selectedPreset ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-300 text-sm font-semibold">
                    {{
                      'upper-body': '🏋️ Upper Body Power',
                      'lower-body': '⚡ Lower Body Strength',
                      'core-stability': '🛡️ Core Stability & Flow',
                    }[detail.selectedPreset] ?? detail.selectedPreset}
                  </span>
                ) : (
                  <span className="text-yellow-50/30 text-sm italic">No protocol selected yet</span>
                )}
              </div>

              {/* Daily suggested workouts */}
              <p className="text-xs font-bold text-yellow-50/60 uppercase tracking-widest mb-3">Daily Suggested Workouts</p>
              <div className="min-h-[80px] bg-[#0f0804]/70 rounded-xl border border-amber-800/30 p-3 flex flex-col gap-2">
                {detail.workoutSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-16 text-yellow-50/30 text-xs gap-1">
                    <ClipboardList size={20} className="opacity-30" />
                    No suggestions available
                  </div>
                ) : (
                  detail.workoutSuggestions.map((w, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-800/30 bg-[#221408]/60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-yellow-50 truncate">{w.WorkoutName}</p>
                        <p className="text-[10px] text-yellow-50/50 mt-0.5">{w.BodyPartName} · {w.Duration} min · {w.Reps} reps</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coach Notes */}
            <div className="mt-10 bg-[#221408]/40 border border-amber-800/40 rounded-2xl p-6">
              <h3 className="text-yellow-50 text-sm uppercase font-bold mb-4">Notes for {detail.player.FirstName}</h3>
              <div className="mb-4">
                <textarea
                  value={coachNoteText}
                  onChange={e => setCoachNoteText(e.target.value)}
                  placeholder={`Write a note for ${detail.player.FirstName}…`}
                  rows={3}
                  className="w-full bg-[#221408] border border-amber-800/60 rounded-lg px-3 py-2 text-sm text-yellow-50 resize-none focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={addCoachNote}
                    disabled={savingCoachNote || !coachNoteText.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors"
                  >
                    {savingCoachNote ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
              </div>
              {coachNotes.length === 0 ? (
                <p className="text-yellow-400/50 text-sm">No notes yet for this athlete.</p>
              ) : (
                <div className="space-y-3">
                  {coachNotes.map(note => (
                    <div key={note.NoteID} className="rounded-xl border border-amber-800/40 bg-[#0f0804]/70 px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-yellow-50/70">{note.NoteDate}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setEditingCoachNoteId(note.NoteID); setEditingCoachNoteText(note.NoteText); }}
                            className="text-xs text-yellow-50 hover:text-amber-400 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCoachNote(note.NoteID)}
                            className="text-xs text-yellow-50 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {editingCoachNoteId === note.NoteID ? (
                        <div>
                          <textarea
                            value={editingCoachNoteText}
                            onChange={e => setEditingCoachNoteText(e.target.value)}
                            rows={3}
                            className="w-full bg-[#221408] border border-amber-800/60 rounded-lg px-3 py-2 text-sm text-yellow-50 resize-none focus:outline-none focus:border-amber-500 mt-1"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setEditingCoachNoteId(null); setEditingCoachNoteText(''); }}
                              className="text-xs text-yellow-50/60 hover:text-white px-3 py-1.5 rounded-lg border border-amber-800/60 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEditedCoachNote(note.NoteID)}
                              disabled={!editingCoachNoteText.trim()}
                              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-50 whitespace-pre-wrap">{note.NoteText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showAddWorkoutModal && selectedId && (
              <AddToTrainingPlanModal
                athleteId={selectedId}
                allWorkouts={allJsonWorkouts}
                preselected={null}
                onClose={() => setShowAddWorkoutModal(false)}
                onSuccess={() => setShowAddWorkoutModal(false)}
              />
            )}
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-yellow-400/50">
            <User className="w-20 h-20 mb-4 opacity-20" />
            <p>Select an athlete from the roster to view readiness.</p>
          </div>
        )}
      </div>

    </main>
  );
}

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
  ChevronLeft } from 'lucide-react';

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
};

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
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="text-cyan-400" size={20} />
            Manage Roster
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Invite Section */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            Invite New Athlete
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Username or Email..." 
              value={inviteValue}
              onChange={(e) => setInviteValue(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
            <button 
              onClick={() => { onInvite(inviteValue); setInviteValue(''); }}
              className="bg-cyan-600 hover:bg-cyan-500 text-black p-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Athlete List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 block">
            Current Athletes ({athletes.length})
          </label>
          {athletes.map(athlete => (
            <div key={athlete.PersonID} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 group hover:border-red-500/50 transition-colors">
              <span className="text-sm font-medium">{athlete.FirstName} {athlete.LastName}</span>
              <button 
                onClick={() => onRemove(athlete.PersonID)}
                className="text-slate-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
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

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [coachName, setCoachName] = useState('');

  // Load roster on mount using session coachId
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(session => {
        if (!session) { router.push('/login'); return; }
        setCoachName(`${session.firstName} ${session.lastName}`);
        return fetch(`/api/coach/athletes?coachId=${session.personId}`)
          .then(r => r.json())
          .then(data => setRoster(data.athletes ?? []))
          .catch(console.error);
      });
  }, [router]);

  // Load individual athlete detail when selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setLoadingDetail(true);
    fetch(`/api/player/${selectedId}`)
      .then(r => r.json())
      .then(data => setDetail(data))
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const activeAthlete = roster.find(a => a.PersonID === selectedId);

  const handleRemoveAthlete = async (athleteId: number) => {
    if (!confirm("Are you sure you want to remove this athlete?")) return;
    
    // Example API Call
    try {
      const response = await fetch(`/api/coach/remove-athlete`, {
        method: 'POST',
        body: JSON.stringify({ athleteId }),
      });
      if (response.ok) {
        setRoster(prev => prev.filter(a => a.PersonID !== athleteId));
      }
    } catch (err) {
      console.error("Failed to remove athlete", err);
    }
  };

  const handleInviteAthlete = async (identifier: string) => {
    if (!identifier) return;
    
    // Example API Call
    console.log("Inviting:", identifier);
    alert(`Invitation sent to ${identifier}!`);
    // In a real app, you'd fetch the updated roster or show a success toast
  };


  return (
    <main className="min-h-screen bg-slate-950 text-white flex overflow-hidden">

      {/* --- LEFT PANEL: ROSTER --- */}
      <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-cyan-400" />
              Team Roster
            </h1>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm"
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">{coachName || 'Coach Dashboard'}</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {roster.length === 0 && (
            <p className="text-slate-500 text-sm text-center mt-8">No athletes assigned</p>
          )}
          {roster.map((athlete) => {
            const atRisk = (athlete.InjuryRiskScore ?? 0) > 0;
            return (
              <div
                key={athlete.PersonID}
                onClick={() => setSelectedId(athlete.PersonID)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                  ${selectedId === athlete.PersonID
                    ? 'bg-slate-800 border-cyan-500 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${atRisk ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    {athlete.FirstName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{athlete.FirstName} {athlete.LastName}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{athlete.SportPlayed} · {athlete.Team}</p>
                  </div>
                </div>

                {atRisk ? (
                  <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle className="text-slate-600 w-5 h-5" />
                )}
              </div>
            );
          })}
        </div>

      {/* --- NEW: MANAGE ROSTER BUTTON --- */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <button 
                onClick={() => setIsManagingRoster(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-cyan-600 hover:border-cyan-500 hover:text-black transition-all font-semibold"
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
      <div className="w-2/3 bg-slate-950 p-10 flex flex-col h-screen overflow-y-auto">
        {loadingDetail ? (
          <div className="h-full flex items-center justify-center text-slate-500">Loading…</div>
        ) : activeAthlete && detail ? (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">

            {/* Top Bar: Athlete Profile */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {detail.player.FirstName} {detail.player.LastName}
                </h2>
                <div className="flex gap-3">
                  <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">{detail.player.SportPlayed}</span>
                  <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">{detail.player.Team}</span>
                  <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">
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
                  <div className="text-xs text-slate-400 mt-1">
                    Progress: {detail.latestReport.ProgressScore} · Last check-in: {detail.latestReport.ReportDate}
                  </div>
                )}
              </div>
            </div>

            {/* THE SPLIT: Soreness + Workout */}
            <div className="grid grid-cols-2 gap-10">

              {/* 1. Soreness report */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Soreness Report</h3>

                <div className="relative min-h-[200px] flex flex-col gap-3 bg-slate-950 rounded-xl border border-slate-800/50 p-4">
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Suggested Session Plan</h3>

                <div className="space-y-4">
                  {detail.workoutSuggestions.length === 0 ? (
                    <p className="text-slate-500 text-sm">No workout suggestions available</p>
                  ) : (
                    detail.workoutSuggestions.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-white bg-slate-800 p-3 rounded border-l-4 border-cyan-500">
                        <ArrowRight className="text-cyan-500 w-4 h-4 shrink-0" />
                        <div className="flex-1">
                          <div className="font-bold text-cyan-400">{w.WorkoutName}</div>
                          <div className="text-xs text-slate-400">Targets: {w.BodyPartName} · {w.Duration} min</div>
                        </div>
                        <div className="font-mono text-sm">{w.Reps} reps</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <User className="w-20 h-20 mb-4 opacity-20" />
            <p>Select an athlete from the roster to view readiness.</p>
          </div>
        )}
      </div>

    </main>
  );
}

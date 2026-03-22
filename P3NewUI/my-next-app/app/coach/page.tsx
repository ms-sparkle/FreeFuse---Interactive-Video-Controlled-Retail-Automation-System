"use client";
import React, { useEffect, useState } from 'react';
import { User, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';

interface Athlete {
    PersonID: number;
    FirstName: string;
    LastName: string;
    SportPlayed: string | null;
    Team: string | null;
    InjuryRiskScore: number | null;
    ProgressScore: number | null;
    ReportDate: string | null;
}

const WORKOUT_LOGIC = {
    original: [
        { name: "Weighted Sit-Ups", sets: "4x12", type: "core" },
        { name: "Box Jumps", sets: "3x5", type: "plyo" },
        { name: "Deadlifts", sets: "3x5", type: "strength" }
    ],
    modification: [
        { name: "Plank Holds", sets: "3x60s", reason: "Reduces spinal flexion load" },
        { name: "Box Jumps", sets: "3x5", reason: "Safe" },
        { name: "Deadlifts", sets: "3x5", reason: "Safe" }
    ]
};

export default function CoachDashboard() {
    const [roster, setRoster] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem('session');
        if (!raw) return;
        const session = JSON.parse(raw);
        fetch(`/api/coach/athletes?coachId=${session.personId}`)
            .then((r) => r.json())
            .then((data: Athlete[]) => setRoster(Array.isArray(data) ? data : []))
            .catch(() => setRoster([]));
    }, []);

    const activeAthlete = roster.find((a) => a.PersonID === selectedAthlete);

    return (
        <main className="min-h-screen bg-slate-950 text-white flex overflow-hidden">

            {/* --- LEFT PANEL: ROSTER --- */}
            <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-cyan-400" />
                        Team Roster
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Friday Session</p>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {roster.length === 0 && (
                        <p className="text-slate-500 text-sm text-center pt-6">No athletes found.</p>
                    )}
                    {roster.map((athlete) => {
                        const atRisk = (athlete.InjuryRiskScore ?? 0) >= 50;
                        const name = `${athlete.FirstName} ${athlete.LastName}`;
                        const metric = athlete.SportPlayed ?? 'Unknown Sport';
                        return (
                            <div
                                key={athlete.PersonID}
                                onClick={() => setSelectedAthlete(athlete.PersonID)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                    ${selectedAthlete === athlete.PersonID
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
                                        <h3 className="font-semibold text-white">{name}</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">{metric}</p>
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
            </div>

            {/* --- RIGHT PANEL: COMMAND CENTER --- */}
            <div className="w-2/3 bg-slate-950 p-10 flex flex-col h-screen overflow-y-auto">
                {activeAthlete ? (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Top Bar: Athlete Profile */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2">
                                    {activeAthlete.FirstName} {activeAthlete.LastName}
                                </h2>
                                <div className="flex gap-3">
                                    <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">
                                        {activeAthlete.SportPlayed ?? 'Unknown Sport'}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">
                                        Team: {activeAthlete.Team ?? '–'}
                                    </span>
                                </div>
                            </div>
                            {/* Readiness Score */}
                            {(() => {
                                const atRisk = (activeAthlete.InjuryRiskScore ?? 0) >= 50;
                                return (
                                    <div className={`text-right ${atRisk ? 'text-red-500' : 'text-green-500'}`}>
                                        <div className="text-sm uppercase font-bold tracking-widest mb-1">Status</div>
                                        <div className="text-3xl font-black flex items-center justify-end gap-2">
                                            {atRisk ? 'MODIFICATION NEEDED' : 'CLEARED TO TRAIN'}
                                            {atRisk ? <AlertTriangle /> : <CheckCircle />}
                                        </div>
                                        {activeAthlete.ReportDate && (
                                            <p className="text-xs text-slate-500 mt-1">Last check-in: {activeAthlete.ReportDate}</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* THE SPLIT: Scores vs Workout */}
                        <div className="grid grid-cols-2 gap-10">

                            {/* 1. Score Summary */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Readiness Scores</h3>
                                <div className="relative h-64 flex flex-col items-center justify-center gap-6 bg-slate-950 rounded-xl border border-slate-800/50 p-4">
                                    {activeAthlete.InjuryRiskScore !== null ? (
                                        <>
                                            <div className="text-center">
                                                <p className="text-slate-400 text-sm mb-1">Injury Risk</p>
                                                <p className={`text-5xl font-bold ${(activeAthlete.InjuryRiskScore ?? 0) >= 50 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {activeAthlete.InjuryRiskScore}
                                                </p>
                                                <p className="text-xs text-slate-500">out of 100</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-400 text-sm mb-1">Progress Score</p>
                                                <p className="text-5xl font-bold text-cyan-400">{activeAthlete.ProgressScore}</p>
                                                <p className="text-xs text-slate-500">out of 100</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-green-500 flex flex-col items-center">
                                            <CheckCircle size={48} className="mb-2 opacity-50" />
                                            <p>No check-in data yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Session Plan */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Session Plan</h3>

                                <div className="space-y-4">
                                    {WORKOUT_LOGIC.original.map((exercise, idx) => {
                                        const atRisk = (activeAthlete.InjuryRiskScore ?? 0) >= 50;
                                        const isBad = atRisk && exercise.name === "Weighted Sit-Ups";

                                        return (
                                            <div key={idx} className="relative">
                                                {isBad ? (
                                                    <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-3">
                                                        <div className="flex justify-between text-slate-500 text-sm line-through mb-2 px-1">
                                                            <span>{exercise.name}</span>
                                                            <span>{exercise.sets}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-white bg-slate-800 p-3 rounded border-l-4 border-cyan-500">
                                                            <ArrowRight className="text-cyan-500 w-4 h-4" />
                                                            <div className="flex-1">
                                                                <div className="font-bold text-cyan-400">Plank Holds</div>
                                                                <div className="text-xs text-slate-400">Reason: Reduces spinal flexion load</div>
                                                            </div>
                                                            <div className="font-mono text-sm">3x60s</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between p-3 bg-slate-950 rounded border border-slate-800">
                                                        <span className="text-white">{exercise.name}</span>
                                                        <span className="font-mono text-slate-400">{exercise.sets}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
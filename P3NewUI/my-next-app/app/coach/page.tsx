"use client";
import React, { useState } from 'react';
import { User, AlertTriangle, CheckCircle, Activity, ArrowRight } from 'lucide-react';

// --- MOCK DATA ---
const ROSTER = [
    { id: 1, name: "Marcus T.", status: "risk", issue: "Abdominals (7/10)", p3_metric: "Core Stability Deficit" },
    { id: 2, name: "Sarah J.", status: "ready", issue: "None", p3_metric: "Optimal" },
    { id: 3, name: "David L.", status: "risk", issue: "Right Knee (6/10)", p3_metric: "Loading Asymmetry" },
    { id: 4, name: "James H.", status: "ready", issue: "None", p3_metric: "Optimal" },
];

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
    const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);

    // Helper to find the active athlete object
    const activeAthlete = ROSTER.find(a => a.id === selectedAthlete);

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
                    {ROSTER.map((athlete) => (
                        <div
                            key={athlete.id}
                            onClick={() => setSelectedAthlete(athlete.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                ${selectedAthlete === athlete.id
                                    ? 'bg-slate-800 border-cyan-500 shadow-lg'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${athlete.status === 'risk' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    {athlete.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{athlete.name}</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">{athlete.p3_metric}</p>
                                </div>
                            </div>

                            {athlete.status === 'risk' ? (
                                <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
                            ) : (
                                <CheckCircle className="text-slate-600 w-5 h-5" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT PANEL: COMMAND CENTER --- */}
            <div className="w-2/3 bg-slate-950 p-10 flex flex-col h-screen overflow-y-auto">
                {activeAthlete ? (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">

                        {/* Top Bar: Athlete Profile */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-2">{activeAthlete.name}</h2>
                                <div className="flex gap-3">
                                    <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">Forward</span>
                                    {/* Fixed Quote Error Here: Used &apos; and &quot; */}
                                    <span className="px-3 py-1 bg-slate-800 rounded text-sm text-slate-300">Height: 6&apos;4&quot;</span>
                                </div>
                            </div>

                            {/* Readiness Score */}
                            <div className={`text-right ${activeAthlete.status === 'risk' ? 'text-red-500' : 'text-green-500'}`}>
                                <div className="text-sm uppercase font-bold tracking-widest mb-1">Status</div>
                                <div className="text-3xl font-black flex items-center justify-end gap-2">
                                    {activeAthlete.status === 'risk' ? 'MODIFICATION NEEDED' : 'CLEARED TO TRAIN'}
                                    {activeAthlete.status === 'risk' ? <AlertTriangle /> : <CheckCircle />}
                                </div>
                            </div>
                        </div>

                        {/* THE SPLIT: Body Map vs Workout */}
                        <div className="grid grid-cols-2 gap-10">

                            {/* 1. The Digital Mirror (Visualizing the Pain) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Subjective Input</h3>

                                {/* Visual Representation of 'Abs Hurt' */}
                                <div className="relative h-64 flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/50">

                                    {activeAthlete.status === 'risk' ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                                                <span className="text-red-500 font-bold">ABS</span>
                                            </div>
                                            <p className="text-red-400 font-bold">Reported Soreness: 7/10</p>
                                        </div>
                                    ) : (
                                        <div className="text-green-500 flex flex-col items-center">
                                            <CheckCircle size={48} className="mb-2 opacity-50" />
                                            <p>All Systems Go</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. The Smart Workout (The Suggestion) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-slate-400 text-sm uppercase font-bold mb-6">Session Plan</h3>

                                <div className="space-y-4">
                                    {WORKOUT_LOGIC.original.map((exercise, idx) => {
                                        // Logic to check if this exercise is "bad"
                                        const isBad = activeAthlete.status === 'risk' && exercise.name === "Weighted Sit-Ups";

                                        return (
                                            <div key={idx} className="relative">
                                                {isBad ? (
                                                    // THE REPLACEMENT UI
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
                                                    // STANDARD EXERCISE
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
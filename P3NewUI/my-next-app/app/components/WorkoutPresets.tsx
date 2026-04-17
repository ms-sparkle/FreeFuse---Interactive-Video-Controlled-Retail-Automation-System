"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Dumbbell, Zap, ArrowRight, Shield } from 'lucide-react';
import workoutData from '@/data/workouts.json';

export function WorkoutPresets() {
    const router = useRouter();

    // Define our demo presets
    const presets = [
        {
            id: 'upper-body',
            name: 'Upper Body Power',
            description: 'Focuses on chest, shoulders, and lat development for explosive upper body strength.',
            icon: <Dumbbell className="text-cyan-500 w-8 h-8" />,
            filterNodes: ['Pectorals / Shoulders', 'Mid-Back / Lats', 'Neck / Traps'],
            color: 'from-cyan-500/20 to-blue-600/20',
            border: 'border-cyan-500/50'
        },
        {
            id: 'lower-body',
            name: 'Lower Body Strength',
            description: 'Builds foundation and power through the quadriceps, hamstrings, and calves.',
            icon: <Zap className="text-purple-500 w-8 h-8" />,
            filterNodes: ['Quadriceps / Hamstrings', 'Calves / Ankles'],
            color: 'from-purple-500/20 to-indigo-600/20',
            border: 'border-purple-500/50'
        },
        {
            id: 'core-stability',
            name: 'Core Stability & Flow',
            description: 'Enhances balance and core strength. Ideal for recovery or active rest days.',
            icon: <Shield className="text-emerald-500 w-8 h-8" />,
            filterNodes: ['Abs / Obliques'],
            color: 'from-emerald-500/20 to-teal-600/20',
            border: 'border-emerald-500/50'
        }
    ];

    const handleSelectPreset = (presetId: string) => {
        // Route to the active workout page, passing the chosen preset in the URL
        router.push(`/active-workout?preset=${presetId}`);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-cyan-400 mb-2">
                        <Activity size={24} />
                        <span className="font-mono text-sm tracking-widest uppercase">WeaveStream Training</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Select Training Protocol</h1>
                    <p className="text-slate-400 mt-2 text-lg">Choose a dynamically generated workout path based on your current physical readiness.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {presets.map((preset) => {
                        // Calculate how many exercises from your JSON match this preset
                        const exerciseCount = workoutData.exercises.filter(ex => 
                            preset.filterNodes.some(node => ex.primary_nodes.includes(node))
                        ).length;

                        return (
                            <button 
                                key={preset.id}
                                onClick={() => handleSelectPreset(preset.id)}
                                className={`group text-left relative flex flex-col h-full bg-slate-900 rounded-2xl p-8 border ${preset.border} hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 overflow-hidden overflow-y-hidden`}
                            >
                                {/* Background Gradient Flare */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${preset.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="bg-slate-950/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-slate-800">
                                        {preset.icon}
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">{preset.name}</h2>
                                    <p className="text-slate-400 text-sm mb-8 flex-grow leading-relaxed">{preset.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-800/50">
                                        <div className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                                            {exerciseCount} Exercises
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold group-hover:text-cyan-400 transition-colors">
                                            Start Protocol <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
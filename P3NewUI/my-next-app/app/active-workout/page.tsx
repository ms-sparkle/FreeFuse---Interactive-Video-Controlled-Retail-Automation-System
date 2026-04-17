"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, CheckCircle, Flame, Timer, ChevronRight } from 'lucide-react';
import workoutData from '@/data/workouts.json';

function WorkoutCompanion() {
    const router = useRouter();

    // State for the timer
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    // State for the completed exercises
    const [completedExercises, setCompletedExercises] = useState<string[]>([]);

    // NEW: State to hold the dynamic exercises loaded from the dashboard
    const [activeExercises, setActiveExercises] = useState<any[]>([]);

    // THE FIX: Load the specific exercises from localStorage on mount
    useEffect(() => {
        const savedWorkouts = localStorage.getItem('selectedActiveWorkouts');

        if (savedWorkouts) {
            try {
                const parsedNames: string[] = JSON.parse(savedWorkouts);

                // Map the saved names back to the full exercise objects from your JSON
                // so the UI can still display 'ex.type' and other details.
                const loadedExercises = parsedNames.map(name => {
                    const found = workoutData.exercises.find((ex: any) => ex.name === name || ex.Name === name);
                    // If it's a valid exercise, return it. Otherwise create a fallback object.
                    return found ? { ...found, name: found.name || found.Name } : { name, type: 'CUSTOM' };
                });

                setActiveExercises(loadedExercises);
            } catch (err) {
                console.error("Failed to parse selected workouts:", err);
            }
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Format seconds into MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleExercise = (exerciseName: string) => {
        setCompletedExercises(prev =>
            prev.includes(exerciseName)
                ? prev.filter(name => name !== exerciseName)
                : [...prev, exerciseName]
        );
    };

    const handleFinish = () => {
        // Stop timer
        setIsRunning(false);
        // Clear out the staging area so the dashboard resets for next time
        localStorage.removeItem('selectedActiveWorkouts');
        localStorage.removeItem('selectedPreset');
        // Route back to check-in
        router.push('/check-in');
    };

    const progressPercentage = activeExercises.length > 0
        ? Math.round((completedExercises.length / activeExercises.length) * 100)
        : 0;

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* LEFT COLUMN: The Timer & Analytics HUD */}
            <div className="lg:w-1/3 flex flex-col gap-6">

                {/* Main Timer Display */}
                <div className="bg-[#1e2336] border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    <div className="text-cyan-500 font-mono text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Timer size={16} /> Active Session
                    </div>

                    <div className="text-7xl font-light tracking-tighter text-white font-mono mb-8">
                        {formatTime(timeElapsed)}
                    </div>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {isRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Resume</>}
                        </button>
                    </div>
                </div>

                {/* Live Analytics Panel */}
                <div className="bg-[#1e2336] border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-xs uppercase tracking-wider mb-6">
                        <Flame size={14} className="text-orange-500" /> Live Metrics
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Workout Completion</span>
                                <span className="text-cyan-400 font-mono font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="text-slate-500 text-xs uppercase mb-1">Calories Burned</div>
                                <div className="text-2xl font-mono text-white">
                                    {Math.floor(timeElapsed * 0.15)} <span className="text-sm text-slate-500">kcal</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="text-slate-500 text-xs uppercase mb-1">Avg Heart Rate</div>
                                <div className="text-2xl font-mono text-white">
                                    124 <span className="text-sm text-slate-500">bpm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: The Exercise List */}
            <div className="lg:w-2/3 bg-[#1e2336] border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col">
                <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                            Protocol Tracker
                        </h2>
                        <p className="text-slate-400 text-sm">Check off exercises as you complete them.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {activeExercises.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No exercises loaded. Please start a workout from the dashboard.</p>
                    ) : (
                        activeExercises.map((ex, index) => {
                            const isDone = completedExercises.includes(ex.name);
                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleExercise(ex.name)}
                                    className={`flex items-center p-5 rounded-2xl border transition-all cursor-pointer ${isDone
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-slate-900 border-slate-800 text-white hover:border-cyan-500/50'
                                        }`}
                                >
                                    <div className="mr-5">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isDone ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-600'
                                            }`}>
                                            {isDone && <CheckCircle size={16} />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xl font-bold ${isDone ? 'line-through opacity-75' : ''}`}>{ex.name}</div>
                                        {ex.type && (
                                            <div className="text-sm opacity-60 flex gap-2 font-mono mt-1">
                                                <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] uppercase">{ex.type}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={handleFinish}
                    className={`mt-8 w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${progressPercentage === 100
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    Complete Protocol & Enter Cooldown <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

export default function ActiveWorkoutPage() {
    return (
        <main className="min-h-screen bg-slate-950 p-6 pt-12">
            <Suspense fallback={<div className="text-cyan-500 font-mono text-center mt-20">Initializing System...</div>}>
                <WorkoutCompanion />
            </Suspense>
        </main>
    );
}
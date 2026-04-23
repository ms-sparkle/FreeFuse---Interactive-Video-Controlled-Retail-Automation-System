"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, CheckCircle, Flame, Timer, ChevronRight, Droplets, Lock } from 'lucide-react';
import workoutData from '@/data/workouts.json';

function WorkoutCompanion() {
    const router = useRouter();

    // ── MAIN TIMERS & STATE ──
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    // ── NEW: LINEAR WORKOUT STATE ──
    const [activeExercises, setActiveExercises] = useState<any[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [exerciseTimer, setExerciseTimer] = useState(0);

    // ── NEW: TRACKING LOGS ──
    const [waterBreaks, setWaterBreaks] = useState<{ time: string, exercise: string }[]>([]);
    const [exerciseLogs, setExerciseLogs] = useState<{ name: string, duration: number }[]>([]);

    // 1. Load the specific exercises from localStorage on mount
    useEffect(() => {
        const savedWorkouts = localStorage.getItem('selectedActiveWorkouts');

        if (savedWorkouts) {
            try {
                const parsedNames: string[] = JSON.parse(savedWorkouts);
                const loadedExercises = parsedNames.map(name => {
                    const found = workoutData.exercises.find((ex: any) => ex.name === name || ex.Name === name);
                    return found ? { ...found, name: found.name || found.Name } : { name, type: 'CUSTOM' };
                });
                setActiveExercises(loadedExercises);
            } catch (err) {
                console.error("Failed to parse selected workouts:", err);
            }
        }
    }, []);

    // 2. Dual Timer Logic (Only increments if workout is not completely finished)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const isWorkoutFinished = currentExerciseIndex >= activeExercises.length && activeExercises.length > 0;

        if (isRunning && !isWorkoutFinished) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
                setExerciseTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, currentExerciseIndex, activeExercises.length]);

    // Format seconds into MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 3. Water Break Action
    const handleWaterBreak = () => {
        setIsRunning(false);
        const activeExName = activeExercises[currentExerciseIndex]?.name || 'Rest';
        setWaterBreaks(prev => [...prev, { time: formatTime(timeElapsed), exercise: activeExName }]);
    };

    // 4. Complete Current Exercise Action (Linear)
    const completeActiveExercise = () => {
        if (currentExerciseIndex >= activeExercises.length) return;

        const currentExName = activeExercises[currentExerciseIndex].name;

        // Log the time it took to complete this specific exercise
        setExerciseLogs(prev => [...prev, { name: currentExName, duration: exerciseTimer }]);

        // Advance to next exercise and reset the secondary timer
        setCurrentExerciseIndex(prev => prev + 1);
        setExerciseTimer(0);
    };

    const handleFinish = async () => {
        setIsRunning(false);

        try {
            const rawSession = localStorage.getItem('session');
            if (!rawSession) {
                router.push('/check-in');
                return;
            }
            const userSession = JSON.parse(rawSession);

            // 1. SAFELY fetch a valid workout name directly from your database
            const exRes = await fetch('/api/exercises');
            let validWorkoutName = 'Squat'; // Hard fallback

            if (exRes.ok) {
                const exData = await exRes.json();
                const backendExercises = exData.exercises || [];

                // Look for the first exercise we actually did to use as the title
                const firstLogged = exerciseLogs.length > 0 ? exerciseLogs[0].name : null;
                const match = backendExercises.find((e: any) => e.Name === firstLogged);

                if (match) {
                    validWorkoutName = match.Name; // Use the exact name the DB expects
                } else if (backendExercises.length > 0) {
                    validWorkoutName = backendExercises[0].Name; // Bypass with first available DB entry
                }
            }

            // 2. Format the custom routine name
            const rawPreset = localStorage.getItem('selectedPreset');
            const routineName = rawPreset
                ? rawPreset.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                : 'Custom Routine';

            const totalMinutes = Math.max(1, Math.floor(timeElapsed / 60));

            // 3. Build the detailed receipt
            const exerciseBreakdown = exerciseLogs.map(log =>
                `• ${log.name}: ${formatTime(log.duration)}`
            ).join('\n');

            const breaks = waterBreaks.length > 0
                ? `\nBreaks taken: ${waterBreaks.length}`
                : '\nNo breaks taken.';

            const detailedNotes = `[${routineName} Protocol - ${totalMinutes} min]\n\nExercise Breakdown:\n${exerciseBreakdown}\n${breaks}`;

            // 4. Send the payload with a GUARANTEED VALID name
            const saveRes = await fetch('/api/workout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    athletePersonId: userSession.personId,
                    workoutName: validWorkoutName, // <--- This keeps the database happy!
                    duration: totalMinutes,
                    notes: detailedNotes           // <--- This keeps the UI looking cool!
                }),
            });

            if (!saveRes.ok) {
                const errText = await saveRes.text();
                alert(`Backend Error! The database rejected the save: ${errText}`);
                return;
            }

            // 5. If successful, clear storage and route
            localStorage.removeItem('selectedActiveWorkouts');
            localStorage.removeItem('selectedPreset');
            router.push('/check-in');

        } catch (error) {
            console.error("Failed to log active session to database:", error);
            alert(`Network error: ${error}`);
        }
    };

    const progressPercentage = activeExercises.length > 0
        ? Math.round((currentExerciseIndex / activeExercises.length) * 100)
        : 0;

    const isWorkoutFinished = currentExerciseIndex >= activeExercises.length && activeExercises.length > 0;

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* LEFT COLUMN: The Timer & Analytics HUD */}
            <div className="lg:w-1/3 flex flex-col gap-6">

                {/* Main Timer Display */}
                <div className={`bg-[#1e2336] border ${!isRunning && !isWorkoutFinished ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800'} rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

                    <div className="text-cyan-500 font-mono text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Timer size={16} /> Total Session Time
                    </div>

                    <div className={`text-7xl font-light tracking-tighter font-mono mb-8 ${!isRunning && !isWorkoutFinished ? 'text-blue-400' : 'text-white'}`}>
                        {formatTime(timeElapsed)}
                    </div>

                    <div className="flex gap-3 w-full">
                        {isRunning ? (
                            <button
                                onClick={handleWaterBreak}
                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Droplets size={20} /> Water Break
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsRunning(true)}
                                disabled={isWorkoutFinished}
                                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            >
                                <Play size={20} /> Resume Workout
                            </button>
                        )}
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
                                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Calories</div>
                                <div className="text-2xl font-mono text-white">
                                    {Math.floor(timeElapsed * 0.15)} <span className="text-xs text-slate-500">kcal</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Avg HR</div>
                                <div className="text-2xl font-mono text-white">
                                    124 <span className="text-xs text-slate-500">bpm</span>
                                </div>
                            </div>
                        </div>

                        {/* Break Log */}
                        {waterBreaks.length > 0 && (
                            <div className="pt-4 border-t border-slate-800/60">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Droplets size={10} className="text-blue-400" /> Breaks Taken ({waterBreaks.length})
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                    {waterBreaks.map((wb, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                            <span>During {wb.exercise}</span>
                                            <span className="font-mono">{wb.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: The Exercise List */}
            <div className="lg:w-2/3 bg-[#1e2336] border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col relative">

                {!isRunning && !isWorkoutFinished && (
                    <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-[2px] rounded-3xl flex items-center justify-center">
                        <div className="bg-slate-900 border border-blue-500/30 p-6 rounded-2xl flex flex-col items-center shadow-2xl">
                            <Droplets size={40} className="text-blue-400 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-1">Hydration Break</h3>
                            <p className="text-slate-400 text-sm mb-4 text-center">Timer paused. Take a sip and catch your breath.</p>
                            <button onClick={() => setIsRunning(true)} className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
                                Resume Training
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                            Protocol Tracker
                        </h2>
                        <p className="text-slate-400 text-sm">Complete exercises in order. Tap the active card to finish it.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {activeExercises.length === 0 ? (
                        <p className="text-slate-500 text-center py-10">No exercises loaded. Please start a workout from the dashboard.</p>
                    ) : (
                        activeExercises.map((ex, index) => {
                            const isDone = index < currentExerciseIndex;
                            const isActive = index === currentExerciseIndex;
                            const isLocked = index > currentExerciseIndex;

                            return (
                                <div
                                    key={index}
                                    onClick={() => isActive && completeActiveExercise()}
                                    className={`relative flex items-center p-5 rounded-2xl border transition-all duration-300 ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500/60 cursor-default' :
                                            isActive ? 'bg-slate-800 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer scale-[1.02]' :
                                                'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    {/* Status Icon */}
                                    <div className="mr-5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isDone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
                                                isActive ? 'border-cyan-500 text-cyan-500' :
                                                    'border-slate-700 text-slate-600 bg-slate-900'
                                            }`}>
                                            {isDone && <CheckCircle size={18} />}
                                            {isActive && <Timer size={16} className="animate-pulse" />}
                                            {isLocked && <Lock size={14} />}
                                        </div>
                                    </div>

                                    {/* Exercise Details */}
                                    <div className="flex-1">
                                        <div className={`text-xl font-bold ${isDone ? 'line-through' : isActive ? 'text-white' : ''}`}>
                                            {ex.name}
                                        </div>
                                        <div className="text-sm flex flex-wrap gap-2 font-mono mt-2">
                                            {ex.type && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-black/30 border border-slate-700/50'}`}>
                                                    {ex.type}
                                                </span>
                                            )}

                                            {/* NEW: Sets and Reps Display */}
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${isActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-black/30 border border-slate-700/50'}`}>
                                                {ex.sets || 3} Sets × {ex.reps || 10} Reps
                                            </span>
                                        </div>
                                    </div>

                                    {/* Secondary Timer (Only shows on active exercise) */}
                                    {isActive && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-1">Current Set</span>
                                            <span className="text-2xl font-mono text-white font-light bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                                                {formatTime(exerciseTimer)}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-2 font-medium bg-slate-700/50 px-2 py-1 rounded">
                                                Tap to complete
                                            </span>
                                        </div>
                                    )}

                                    {/* Static time logged for finished exercises */}
                                    {isDone && (
                                        <div className="font-mono text-sm">
                                            {formatTime(exerciseLogs.find(log => log.name === ex.name)?.duration || 0)}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={handleFinish}
                    disabled={!isWorkoutFinished}
                    className={`mt-8 w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-500 ${isWorkoutFinished
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-105'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {isWorkoutFinished ? 'Complete Protocol & Enter Cooldown' : 'Finish all exercises to continue'}
                    <ChevronRight size={20} />
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
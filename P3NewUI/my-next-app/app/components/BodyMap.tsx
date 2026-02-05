"use client";
import React, { useState } from 'react';

// 1. Define the Shapes (The SVG Paths for the muscles)
// You can get more paths from free SVG body map resources online
const MUSCLE_PATHS = {
  chest: {
    id: 'chest',
    name: 'Pectorals',
    path: "M100,60 Q130,60 150,80 Q170,60 200,60 Q210,80 200,110 Q150,130 100,110 Q90,80 100,60 Z" 
  },
  abs: {
    id: 'abs',
    name: 'Abdominals',
    path: "M115,115 L185,115 L175,180 L125,180 Z"
  },
  l_quad: {
    id: 'l_quad',
    name: 'Left Quad',
    path: "M115,185 L145,185 L140,260 L120,260 Z" // Simplified quad shape
  },
  r_quad: {
    id: 'r_quad',
    name: 'Right Quad',
    path: "M155,185 L185,185 L180,260 L160,260 Z"
  },
  // Add more muscles here (Calves, Shoulders, etc.)
};

type SorenessRecord = {
  [key: string]: number; // e.g., { 'l_quad': 7, 'chest': 3 }
};

export default function BodyMap() {
  const [sorenessData, setSorenessData] = useState<SorenessRecord>({});
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  
  // Temporary state for the slider before saving
  const [currentLevel, setCurrentLevel] = useState(5);

  const handleMuscleClick = (muscleId: string) => {
    setActiveMuscle(muscleId);
    // If we already have data for this muscle, load it. Otherwise default to 5.
    setCurrentLevel(sorenessData[muscleId] || 5);
  };

  const saveSoreness = () => {
    if (activeMuscle) {
      setSorenessData(prev => ({
        ...prev,
        [activeMuscle]: currentLevel
      }));
      setActiveMuscle(null); // Close the modal/popup
    }
  };

  // Helper to determine color based on soreness level
  const getMuscleColor = (id: string) => {
    const level = sorenessData[id];
    if (!level) return "#334155"; // Default Slate-700 (Inactive)
    if (level < 4) return "#22c55e"; // Green (Low)
    if (level < 7) return "#eab308"; // Yellow (Medium)
    return "#ef4444"; // Red (High)
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-8 bg-slate-950 min-h-[600px] text-white">
      
      {/* --- THE BODY MAP --- */}
      <div className="relative w-[300px] h-[500px]">
        <svg viewBox="0 0 300 500" className="drop-shadow-2xl">
          {/* Base Silhouette (Optional outline) */}
          <path d="M80,50 Q150,10 220,50 L220,300 L80,300 Z" fill="#1e293b" className="opacity-50" />

          {/* Render Muscles */}
          {Object.values(MUSCLE_PATHS).map((muscle) => (
            <path
              key={muscle.id}
              d={muscle.path}
              onClick={() => handleMuscleClick(muscle.id)}
              fill={getMuscleColor(muscle.id)}
              stroke="white"
              strokeWidth="1" // Thin stroke for clean look
              className="cursor-pointer hover:opacity-80 transition-all duration-200"
            />
          ))}
        </svg>
        
        {/* Helper Text */}
        <p className="text-center text-slate-500 mt-4 text-sm uppercase tracking-widest">
          Tap muscle to log
        </p>
      </div>

      {/* --- THE INTERACTION PANEL (Popup/Sidebar) --- */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
        {activeMuscle ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold mb-1 text-cyan-400">
              {MUSCLE_PATHS[activeMuscle as keyof typeof MUSCLE_PATHS].name}
            </h2>
            <p className="text-slate-400 mb-6 text-sm">Rate your soreness level</p>

            {/* The Soreness Counter/Slider */}
            <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-bold text-green-500">FRESH (1)</span>
               <span className="text-xs font-bold text-red-500">PAIN (10)</span>
            </div>
            
            <input
              type="range"
              min="1"
              max="10"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(Number(e.target.value))}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-6"
            />

            <div className="flex justify-between items-end mb-6">
               <div className="text-6xl font-thin text-white">{currentLevel}</div>
               <div className="text-sm text-slate-500 pb-2">Intensity Score</div>
            </div>

            <button
              onClick={saveSoreness}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
            >
              Save Status
            </button>
            <button 
              onClick={() => setActiveMuscle(null)}
              className="w-full mt-3 py-2 text-slate-500 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-10 opacity-50">
            <div className="text-4xl mb-4">👆</div>
            <h3 className="text-xl font-semibold">Select a Muscle</h3>
            <p className="text-sm mt-2">Click on the body map to begin check-in.</p>
          </div>
        )}
      </div>

    </div>
  );
}
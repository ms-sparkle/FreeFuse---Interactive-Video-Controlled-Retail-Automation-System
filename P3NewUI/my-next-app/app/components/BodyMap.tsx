"use client";
import Link from 'next/link';
import React, { useState } from 'react';
import { bodyFemaleFront } from '../assets/bodyFemaleFront';
import { bodyFemaleBack } from '../assets/bodyFemaleBack';
import { bodyFront } from '../assets/bodyFront';
import { bodyBack } from '../assets/bodyBack';
import { SvgFemaleWrapper } from './SvgFemaleWrapper';
import { SvgMaleWrapper } from './SvgMaleWrapper';

// Using anatomical SVG paths from react-native-body-highlighter (MIT License)
const BODYMAP_SCALE = 1.5;

type SorenessRecord = {
  [key: string]: number;
};

// Helper to get readable muscle name
const getMuscleName = (slug: string): string => {
  const names: Record<string, string> = {
    'chest': 'Chest',
    'abs': 'Abs',
    'quadriceps': 'Quadriceps',
    'biceps': 'Biceps',
    'deltoids': 'Shoulders',
    'calves': 'Calves',
    'triceps': 'Triceps',
    'obliques': 'Obliques',
    'forearm': 'Forearms',
    'neck': 'Neck',
    'trapezius': 'Trapezius',
    'adductors': 'Adductors',
    'tibialis': 'Tibialis',
    'knees': 'Knees',
    'hands': 'Hands',
    'ankles': 'Ankles',
    'feet': 'Feet',
    'upper-back': 'Upper Back',
    'lower-back': 'Lower Back',
    'gluteal': 'Glutes',
    'hamstring': 'Hamstrings',
    'head': 'Head',
    'hair': 'Hair'
  };
  return names[slug] || slug;
};

export default function BodyMap() {
  const [sorenessData, setSorenessData] = useState<SorenessRecord>({});
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState(5);
  const [bodyVariant, setBodyVariant] = useState<'female' | 'male'>('female');
  const [bodySide, setBodySide] = useState<'front' | 'back'>('front');

  const bodyData = bodySide === 'front'
    ? (bodyVariant === 'female' ? bodyFemaleFront : bodyFront)
    : (bodyVariant === 'female' ? bodyFemaleBack : bodyBack);

  const Wrapper = bodyVariant === 'female' ? SvgFemaleWrapper : SvgMaleWrapper;

  const saveSoreness = () => {
    if (activeMuscle) {
      setSorenessData(prev => ({
        ...prev,
        [activeMuscle]: currentLevel
      }));
      setActiveMuscle(null);
    }
  };

  // Helper to determine color based on soreness level
  const getMuscleColor = (muscleId: string) => {
    const level = sorenessData[muscleId];
    if (!level) return "#334155"; // Default Slate-700 (Inactive)
    if (level < 4) return "#22c55e"; // Green (Low)
    if (level < 7) return "#eab308"; // Yellow (Medium)
    return "#ef4444"; // Red (High)
  };
  
  const handleMuscleClickWithSide = (slug: string, side?: 'left' | 'right' | 'common') => {
    const fullId = side && side !== 'common' ? `${slug}_${side}` : slug;
    setActiveMuscle(fullId);
    setCurrentLevel(sorenessData[fullId] || 5);
  };

  const handleMuscleHoverWithSide = (slug: string, side?: 'left' | 'right' | 'common') => {
    const fullId = side && side !== 'common' ? `${slug}_${side}` : slug;
    setHoveredMuscle(fullId);
  };

  return (
    <div className="relative flex flex-col md:flex-row gap-8 items-center justify-center p-8 bg-slate-950 min-h-[600px] text-white">
      
      {/* --- THE BODY MAP --- */}
      <div className="relative w-[300px] h-[600px]">
        <div className="absolute -top-4 right-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBodySide(prev => (prev === 'front' ? 'back' : 'front'))}
            className="px-3 py-1 text-xs uppercase tracking-widest bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full border border-slate-700"
          >
            {bodySide === 'front' ? 'Front' : 'Back'}
          </button>
          <button
            type="button"
            onClick={() => setBodyVariant(prev => (prev === 'female' ? 'male' : 'female'))}
            className="px-3 py-1 text-xs uppercase tracking-widest bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full border border-slate-700"
          >
            {bodyVariant === 'female' ? 'Female' : 'Male'}
          </button>
        </div>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-xs uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
          {bodySide === 'front' ? 'Front View' : 'Back View'}
        </div>
        <Wrapper
          scale={BODYMAP_SCALE}
          side={bodySide}
          border="none"
          className="drop-shadow-2xl"
        >
          <g>
            {/* Render Muscles */}
            {bodyData.map((muscle) => {
              // Skip hair and head for cleaner visualization
              if (muscle.slug === 'hair' || muscle.slug === 'head') return null;
              
              return (
                <g key={muscle.slug}>
                  {/* Optional hit areas (invisible, larger click targets) */}
                  {muscle.hitPath?.common?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-hit-common-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'common')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'common')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      fill="transparent"
                      stroke="transparent"
                      pointerEvents="all"
                      className="cursor-pointer"
                    />
                  ))}
                  {muscle.hitPath?.left?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-hit-left-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'left')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'left')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      fill="transparent"
                      stroke="transparent"
                      pointerEvents="all"
                      className="cursor-pointer"
                    />
                  ))}
                  {muscle.hitPath?.right?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-hit-right-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'right')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'right')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      fill="transparent"
                      stroke="transparent"
                      pointerEvents="all"
                      className="cursor-pointer"
                    />
                  ))}

                  {/* Common path (for symmetric parts like neck) */}
                  {muscle.path.common?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-common-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'common')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'common')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      pointerEvents="bounding-box"
                      fill={getMuscleColor(muscle.slug)}
                      stroke="white"
                      strokeWidth="2"
                      className={`cursor-pointer transition-all duration-200 ${
                        hoveredMuscle === muscle.slug ? 'opacity-100 brightness-110' : 'opacity-85'
                      }`}
                    />
                  ))}
                  
                  {/* Left side paths */}
                  {muscle.path.left?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-left-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'left')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'left')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      pointerEvents="bounding-box"
                      fill={getMuscleColor(`${muscle.slug}_left`)}
                      stroke="white"
                      strokeWidth="2"
                      className={`cursor-pointer transition-all duration-200 ${
                        hoveredMuscle === `${muscle.slug}_left` ? 'opacity-100 brightness-110' : 'opacity-85'
                      }`}
                    />
                  ))}
                  
                  {/* Right side paths */}
                  {muscle.path.right?.map((pathData, idx) => (
                    <path
                      key={`${muscle.slug}-right-${idx}`}
                      d={pathData}
                      onClick={() => handleMuscleClickWithSide(muscle.slug, 'right')}
                      onMouseEnter={() => handleMuscleHoverWithSide(muscle.slug, 'right')}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      pointerEvents="bounding-box"
                      fill={getMuscleColor(`${muscle.slug}_right`)}
                      stroke="white"
                      strokeWidth="2"
                      className={`cursor-pointer transition-all duration-200 ${
                        hoveredMuscle === `${muscle.slug}_right` ? 'opacity-100 brightness-110' : 'opacity-85'
                      }`}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </Wrapper>
        
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
              {(() => {
                // Extract base slug and side from active muscle (e.g., "chest_left" -> "chest")
                const baseSlug = activeMuscle.includes('_') ? activeMuscle.split('_')[0] : activeMuscle;
                const side = activeMuscle.includes('_left') ? ' (Left)' : activeMuscle.includes('_right') ? ' (Right)' : '';
                return getMuscleName(baseSlug) + side;
              })()}
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

      <Link
        href="/player-dashboard"
        className="absolute bottom-6 right-6 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors shadow-lg"
      >
        Continue to Dashboard
      </Link>

    </div>
  );
}
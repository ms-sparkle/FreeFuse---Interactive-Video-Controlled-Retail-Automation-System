"use client";

import React, { useRef, useState, Suspense, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Activity, CheckCircle, Crosshair, SlidersHorizontal, Ruler, Dumbbell, Droplets } from 'lucide-react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- DEMO MESH WITH GLOWING SORENESS NODES ---
function DemoHumanMesh({ 
    height, 
    muscle, 
    pendingMarker, 
    savedMarkers, 
    onMuscleClick 
}: { 
    height: number, 
    muscle: number, 
    pendingMarker: THREE.Vector3 | null,
    savedMarkers: { zone: string, level: number, position: THREE.Vector3 }[],
    onMuscleClick: (part: string, localPoint: THREE.Vector3) => void 
}) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF("/generated_twin.glb");

    const heightScale = height / 175;
    const widthScale = 1.0 + (muscle - 8.0) * 0.05;

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshStandardMaterial({
                    color: "#22d3ee", // Body stays Cyan permanently
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.3,
                    metalness: 0.7
                });
            }
        });
        return clone;
    }, [scene]);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation(); 
        if (!groupRef.current) return;

        // Get the exact 3D coordinate of the click, relative to the rotating group
        const localPoint = groupRef.current.worldToLocal(e.point.clone());

        const clickY = e.point.y;
        let semanticBodyPart = "Core / Abdomen";

        if (clickY > 1) semanticBodyPart = "Neck / Traps";
        else if (clickY > 0.55) semanticBodyPart = "Pectorals / Shoulders";
        else if (clickY > 0.3) semanticBodyPart = "Mid-Back / Lats";
        else if (clickY > 0) semanticBodyPart = "Abs / Obliques";
        else if (clickY > -0.8) semanticBodyPart = "Quadriceps / Hamstrings";
        else semanticBodyPart = "Calves / Ankles";

        onMuscleClick(semanticBodyPart, localPoint);
    };

    useFrame((state, delta) => {
        if (groupRef.current) groupRef.current.rotation.y += delta * 0.2; 
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]} scale={[1.7 * widthScale, 1.7 * heightScale, 1.7 * widthScale]}>
            <primitive 
                object={clonedScene} 
                onPointerDown={handlePointerDown} 
                onPointerOver={() => document.body.style.cursor = 'crosshair'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            />
            
            {/* The Yellow "Pending" Node */}
            {pendingMarker && (
                <mesh position={pendingMarker}>
                    <sphereGeometry args={[0.04, 16, 16]} />
                    <meshBasicMaterial color="#fbbf24" />
                </mesh>
            )}

            {/* The Red "Saved" Nodes */}
            {savedMarkers.map((m, i) => (
                <mesh key={i} position={m.position}>
                    <sphereGeometry args={[0.04, 16, 16]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
            ))}
        </group>
    );
}

export default function DemoDayVideo() {
    const router = useRouter();
    const [step, setStep] = useState<'intro' | 'scanning' | 'result'>('intro');
    const [scanProgress, setScanProgress] = useState(0);
    
    const [height, setHeight] = useState(175);
    const [muscle, setMuscle] = useState(8.0);
    const [bodyFat, setBodyFat] = useState(15);
    
    // Updated Soreness State for 3D Nodes
    const [savedMarkers, setSavedMarkers] = useState<{ zone: string, level: number, position: THREE.Vector3 }[]>([]);
    const [pendingMarker, setPendingMarker] = useState<THREE.Vector3 | null>(null);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [sorenessLevel, setSorenessLevel] = useState<number>(5);

    const videoRef = useRef<HTMLVideoElement>(null);

    const startScanProcess = async () => {
        setStep('scanning');
        setScanProgress(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.warn("Camera failed, continuing demo.");
        }

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                completeScan();
            }
        }, 150);
    };

    const completeScan = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setHeight(182); 
        setMuscle(9.5);
        setStep('result');
    };

    const handleMuscleClick = (zoneName: string, localPoint: THREE.Vector3) => {
        setPendingMarker(localPoint);
        setSelectedZone(zoneName);
        setSorenessLevel(5); 
    };

    const saveSoreness = () => {
        if (pendingMarker && selectedZone) {
            setSavedMarkers(prev => {
                const filtered = prev.filter(z => z.zone !== selectedZone);
                return [...filtered, { zone: selectedZone, level: sorenessLevel, position: pendingMarker }];
            });
            setPendingMarker(null);
            setSelectedZone(null);
        }
    };

    const cancelSelection = () => {
        setPendingMarker(null);
        setSelectedZone(null);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-6">
            <div className="w-full max-w-7xl flex justify-between items-center mb-8 pt-4">
                <div className="font-mono text-cyan-500 border border-cyan-500 px-3 py-1 rounded text-sm flex items-center gap-2">
                    <Activity size={16} /> Scan your body for soreness
                </div>
            </div>

            <div className="w-full max-w-7xl">
                {step === 'intro' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl max-w-3xl mx-auto">
                        <Camera size={64} className="mx-auto text-cyan-500 mb-6" />
                        <h1 className="text-3xl font-bold mb-4">Biometric Calibration</h1>
                        <button onClick={startScanProcess} className="px-8 py-4 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 text-lg mt-4">
                            Initiate Athlete Scan
                        </button>
                    </div>
                )}

                {step === 'scanning' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-3xl mx-auto">
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 mb-8">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Crosshair size={120} className="text-cyan-500/50 animate-pulse" />
                            </div>
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between mb-2 text-sm text-cyan-500 font-mono">
                                <span>Generating Mesh</span><span>{scanProgress}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-150" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'result' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[750px]">
                        
                        {/* LEFT COLUMN: Semantic Sliders */}
                        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                                <CheckCircle className="text-green-400 w-6 h-6" />
                                <div>
                                    <h2 className="text-lg font-bold">Scan Complete</h2>
                                    <p className="text-slate-400 text-xs">Adjust if needed</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2"><Ruler size={14} className="text-cyan-500" /> Height</label>
                                        <span className="font-mono text-sm text-cyan-400">{height} cm</span>
                                    </div>
                                    <input type="range" min="140" max="220" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2"><Dumbbell size={14} className="text-cyan-500" /> Muscle</label>
                                        <span className="font-mono text-sm text-cyan-400">{muscle.toFixed(1)}</span>
                                    </div>
                                    <input type="range" min="5.0" max="15.0" step="0.1" value={muscle} onChange={(e) => setMuscle(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2"><Droplets size={14} className="text-cyan-500" /> Body Fat</label>
                                        <span className="font-mono text-sm text-cyan-400">{bodyFat} %</span>
                                    </div>
                                    <input type="range" min="3" max="40" value={bodyFat} onChange={(e) => setBodyFat(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE COLUMN: Interactive Canvas */}
                        <div className="lg:col-span-6 bg-transparent overflow-hidden relative flex items-center justify-center">
                            <Canvas camera={{ position: [0, 1, 4.5], fov: 50 }}>
                                <ambientLight intensity={0.8} />
                                <directionalLight position={[5, 5, 5]} intensity={2.5} />
                                <directionalLight position={[-5, 5, 2]} intensity={1} />
                                <Environment preset="city" />
                                <Suspense fallback={null}>
                                    <DemoHumanMesh 
                                        height={height} 
                                        muscle={muscle} 
                                        pendingMarker={pendingMarker}
                                        savedMarkers={savedMarkers}
                                        onMuscleClick={handleMuscleClick} 
                                    />
                                </Suspense>
                                <OrbitControls enableZoom={true} />
                            </Canvas>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-sm tracking-widest uppercase bg-slate-950/80 px-4 py-2 rounded-full backdrop-blur pointer-events-none">
                                Tap Muscle to Log
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Soreness Rater Panel */}
                        <div className="lg:col-span-3 flex flex-col justify-center">
                            {selectedZone ? (
                                <div className="bg-[#1e2336] rounded-2xl p-6 shadow-2xl border border-slate-700">
                                    <h2 className="text-cyan-400 text-xl font-bold mb-1">{selectedZone}</h2>
                                    <p className="text-slate-400 text-xs mb-6">Rate your soreness level</p>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-[10px] font-bold mb-3 tracking-wider">
                                            <span className="text-green-500">FRESH (1)</span>
                                            <span className="text-red-500">PAIN (10)</span>
                                        </div>
                                        <input 
                                            type="range" min="1" max="10" 
                                            value={sorenessLevel} 
                                            onChange={(e) => setSorenessLevel(Number(e.target.value))} 
                                            className="w-full accent-cyan-500 cursor-pointer" 
                                        />
                                    </div>

                                    <div className="flex items-end gap-3 mb-8">
                                        <span className="text-5xl font-bold">{sorenessLevel}</span>
                                        <span className="text-slate-500 text-xs mb-2">Intensity Score</span>
                                    </div>

                                    <button onClick={saveSoreness} className="w-full py-3 bg-[#0bd6e6] text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors mb-2 text-sm">
                                        Save Status
                                    </button>
                                    
                                    <button onClick={cancelSelection} className="w-full py-2 text-slate-400 hover:text-white transition-colors text-xs">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full justify-between">
                                    <div className="bg-[#1e2336] rounded-2xl p-6 shadow-2xl border border-slate-700 mt-auto mb-6 max-h-[400px] overflow-y-auto">
                                        <div className="text-slate-400 text-xs uppercase font-bold mb-4">Logged Data</div>
                                        {savedMarkers.length === 0 ? (
                                            <div className="text-slate-500 text-xs">No soreness logged. Tap the 3D model to begin.</div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {savedMarkers.map((z, i) => (
                                                    <li key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded text-sm border border-slate-800">
                                                        <span className="font-bold text-xs">{z.zone}</span>
                                                        <span className="text-red-400 bg-red-900/20 px-2 py-1 rounded text-xs">Level {z.level}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => router.push('/player-dashboard')} 
                                        className="w-full py-4 bg-[#0bd6e6] text-black font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                                    >
                                        Continue to Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

useGLTF.preload('/generated_twin.glb');
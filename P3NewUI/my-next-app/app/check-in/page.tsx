"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BodyMap from '../components/BodyMap';

export default function CheckInPage() {
    const [userSex, setUserSex] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Grab the active session from local storage
        const raw = localStorage.getItem('session');
        if (!raw) {
            window.location.href = '/login';
            return;
        }

        const session = JSON.parse(raw);

        // Fetch the user's profile to determine which body model to render
        fetch(`/api/player/${session.personId}`)
            .then(res => res.json())
            .then(data => {
                if (data?.player?.Sex) {
                    setUserSex(data.player.Sex);
                } else {
                    setUserSex('Male'); // Fallback just in case it's missing
                }
            })
            .catch(err => console.error("Failed to load user profile", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center py-10">

            {/* Header / Nav Area */}
            <div className="w-full max-w-6xl px-6 mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Daily Readiness
                    </h1>
                    <p className="text-slate-400">Scan your body for soreness</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* NEW: WIP 3D Model Button */}
                    <Link
                        href="/anny-test"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="text-base leading-none">🧊</span>
                        3D Model (WIP)
                    </Link>

                    {/* Simple P3 / WeaveStream Logo placeholder */}
                    <div className="font-mono text-cyan-500 border border-cyan-500 px-3 py-1 rounded">
                        Member Kiosk
                    </div>
                </div>
            </div>

            {/* The Interactive Component */}
            <div className="w-full max-w-6xl">
                {loading ? (
                    <div className="text-center text-slate-500 py-20 font-mono animate-pulse">
                        Loading your biometric profile...
                    </div>
                ) : (
                    <BodyMap sex={userSex} />
                )}
            </div>

        </main>
    );
}
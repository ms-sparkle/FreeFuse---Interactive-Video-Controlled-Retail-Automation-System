"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, ArrowLeft, Shield } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
    const searchParams = useSearchParams();

    // Grab the URL parameter, default to athlete if missing
    const initialRole = searchParams.get('role') === 'coach' ? 'coach' : 'athlete';

    // We use state so if they change the dropdown, the theme instantly updates!
    const [role, setRole] = useState(initialRole);
    const isCoach = role === 'coach';

    // Dynamic Theme Variables with smooth transitions
    const iconBg = isCoach ? 'bg-amber-500/10' : 'bg-cyan-500/10';
    const iconText = isCoach ? 'text-amber-500' : 'text-cyan-400';
    const inputFocus = isCoach ? 'focus:border-amber-500 focus:ring-amber-500' : 'focus:border-cyan-500 focus:ring-cyan-500';
    const buttonBg = isCoach ? 'bg-amber-500 hover:bg-amber-400' : 'bg-cyan-500 hover:bg-cyan-400';
    const linkText = isCoach ? 'text-amber-500 hover:text-amber-400' : 'text-cyan-400 hover:text-cyan-300';
    const backLink = isCoach ? '/login/coach' : '/login/athlete';

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl mt-12 mb-12 relative z-10 transition-colors duration-500">
            <div className="flex flex-col items-center mb-8">
                <div className={`p-4 rounded-full mb-4 transition-colors duration-500 ${iconBg}`}>
                    <UserPlus className={`w-10 h-10 transition-colors duration-500 ${iconText}`} />
                </div>
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-slate-400 text-sm mt-1">Join the WeaveStream platform</p>
            </div>

            <form className="space-y-5">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder="John Doe"
                        />
                        <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                        <input
                            type="email"
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder={isCoach ? "coach@team.com" : "athlete@team.com"}
                        />
                        <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                {/* Role Selection (This drives the theme!) */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Account Type</label>
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${inputFocus}`}
                        >
                            <option value="athlete">Team Member (Athlete)</option>
                            <option value="coach">Staff (Coach/Trainer)</option>
                        </select>
                        <Shield className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                    <div className="relative">
                        <input
                            type="password"
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder="********"
                        />
                        <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                <Link href={backLink} className="block mt-8">
                    <button type="button" className={`w-full py-3 text-black font-bold rounded-lg transition-colors duration-300 ${buttonBg}`}>
                        Register
                    </button>
                </Link>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account? <Link href={backLink} className={`${linkText} hover:underline transition-colors`}>Sign in</Link>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
            {/* Universal Back Button */}
            <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Roles</span>
            </Link>

            <Suspense fallback={<div className="text-slate-500 mt-20">Loading...</div>}>
                <RegisterContent />
            </Suspense>
        </main>
    );
}
"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Lock, User, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialRole = searchParams.get('role') === 'coach' ? 'coach' : 'athlete';
    const [role, setRole] = useState(initialRole);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isCoach = role === 'coach';
    const iconBg = isCoach ? 'bg-amber-500/10' : 'bg-cyan-500/10';
    const iconText = isCoach ? 'text-amber-500' : 'text-cyan-400';
    const inputFocus = isCoach ? 'focus:border-amber-500 focus:ring-amber-500' : 'focus:border-cyan-500 focus:ring-cyan-500';
    const buttonBg = isCoach ? 'bg-amber-500 hover:bg-amber-400' : 'bg-cyan-500 hover:bg-cyan-400';
    const linkText = isCoach ? 'text-amber-500 hover:text-amber-400' : 'text-cyan-400 hover:text-cyan-300';
    const backLink = isCoach ? '/login/coach' : '/login/athlete';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!firstName || !lastName || !username || !password) {
            setError('All fields are required.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, username, password, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Registration failed.');
                return;
            }
            router.push(backLink + '?registered=1');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl mt-12 mb-12 relative z-10 transition-colors duration-500">
            <div className="flex flex-col items-center mb-8">
                <div className={`p-4 rounded-full mb-4 transition-colors duration-500 ${iconBg}`}>
                    <UserPlus className={`w-10 h-10 transition-colors duration-500 ${iconText}`} />
                </div>
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-slate-400 text-sm mt-1">Join the WeaveStream platform</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                {/* First / Last Name */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">First Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                                placeholder="Jane"
                            />
                            <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder="Doe"
                        />
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder={isCoach ? 'coach_smith' : 'athlete_doe'}
                        />
                        <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                {/* Role Selection */}
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
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-11 py-3 text-white focus:outline-none focus:ring-1 transition-all ${inputFocus}`}
                            placeholder="Min. 6 characters"
                        />
                        <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3 text-black font-bold rounded-lg transition-colors duration-300 disabled:opacity-50 mt-8 ${buttonBg}`}
                >
                    {submitting ? 'Creating Account…' : 'Register'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href={backLink} className={`${linkText} hover:underline transition-colors`}>
                    Sign in
                </Link>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
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

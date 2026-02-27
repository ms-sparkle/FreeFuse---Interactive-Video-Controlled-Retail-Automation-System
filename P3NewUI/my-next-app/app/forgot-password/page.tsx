"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const isCoach = role === 'coach';

    // Dynamic Theme Variables
    const themeColor = isCoach ? 'amber' : 'cyan';
    const iconBg = isCoach ? 'bg-amber-500/10' : 'bg-cyan-500/10';
    const iconText = isCoach ? 'text-amber-500' : 'text-cyan-400';
    const inputFocus = isCoach ? 'focus:border-amber-500 focus:ring-amber-500' : 'focus:border-cyan-500 focus:ring-cyan-500';
    const buttonBg = isCoach ? 'bg-amber-500 hover:bg-amber-400' : 'bg-cyan-500 hover:bg-cyan-400';
    const linkText = isCoach ? 'text-amber-500 hover:text-amber-400' : 'text-cyan-400 hover:text-cyan-300';
    const backLink = isCoach ? '/login/coach' : '/login/athlete';

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl z-10">
            <div className="flex flex-col items-center mb-8 text-center">
                <div className={`p-4 rounded-full mb-4 ${iconBg}`}>
                    <KeyRound className={`w-10 h-10 ${iconText}`} />
                </div>
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-slate-400 text-sm mt-2">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            <form className="space-y-6">
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

                <Link href={backLink} className="block">
                    <button type="button" className={`w-full py-3 text-black font-bold rounded-lg transition-colors ${buttonBg}`}>
                        Send Reset Link
                    </button>
                </Link>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
                Remember your password? <Link href={backLink} className={`${linkText} hover:underline`}>Return to login</Link>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
            {/* Universal Back Button */}
            <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Roles</span>
            </Link>

            <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
                <ForgotPasswordContent />
            </Suspense>
        </main>
    );
}
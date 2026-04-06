'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { User, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

function AthleteLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered') === '1';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Login failed');
                return;
            }
            if (data.role !== 'athlete') {
                setError('This account is not an athlete account');
                return;
            }
            localStorage.setItem('session', JSON.stringify({
                personId: data.personId,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
                sex: data.sex ?? null,
            }));
            router.push('/check-in');
        } catch {
            setError('Network error – please try again');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
            <div className="flex flex-col items-center mb-8">
                <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                    <User className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold">Member Sign In</h1>
                <p className="text-slate-400 text-sm mt-1">Access your daily readiness check-in</p>
            </div>

            {registered && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Account created! Sign in below.
                </div>
            )}

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="a_davis"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            placeholder="********"
                            required
                        />
                        <Lock className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span />
                    <a href="/forgot-password?role=athlete" className="text-cyan-400 hover:text-cyan-300">Forgot password?</a>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-lg transition-colors"
                >
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
                Don&apos;t have an account? <a href="/register?role=athlete" className="text-cyan-400 hover:underline">Register here</a>
            </div>
        </div>
    );
}

export default function AthleteLogin() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
            <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Roles</span>
            </Link>
            <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
                <AthleteLoginForm />
            </Suspense>
        </main>
    );
}

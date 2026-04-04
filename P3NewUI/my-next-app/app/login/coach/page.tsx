'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export default function CoachLogin() {
    const router = useRouter();
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
            if (data.role !== 'coach') {
                setError('This account is not a coach account');
                return;
            }
            router.push('/coach');
        } catch {
            setError('Network error – please try again');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">

            {/* Back Button */}
            <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Roles</span>
            </Link>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-amber-500/10 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold">Coach Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Authorized Staff Only</p>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Staff ID / Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            placeholder="c_smith"
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
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                                placeholder="********"
                                required
                            />
                            <Lock className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span />
                        <a href="/forgot-password?role=coach" className="text-amber-500 hover:text-amber-400">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg transition-colors"
                    >
                        {loading ? 'Accessing…' : 'Access Dashboard'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Need portal access? <a href="mailto:admin@weavestream.com?subject=Coach%20Portal%20Access%20Request" className="text-amber-500 hover:underline">Contact Admin</a>
                </div>
            </div>
        </main>
    );
}
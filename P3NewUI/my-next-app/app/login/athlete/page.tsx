import Link from 'next/link';
import { User, Lock, ArrowLeft } from 'lucide-react';

export default function AthleteLogin() {
    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">

            {/* Back Button */}
            <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Roles</span>
            </Link>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-cyan-500/10 rounded-full mb-4">
                        <User className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold">Member Sign In</h1>
                    <p className="text-slate-400 text-sm mt-1">Access your daily readiness check-in</p>
                </div>

                <form className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Username / Email</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                            placeholder="athlete@team.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="********"
                            />
                            <Lock className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-cyan-500" />
                            <span className="text-slate-400">Remember me</span>
                        </label>
                        <a href="/forgot-password?role=athlete" className="text-cyan-400 hover:text-cyan-300">Forgot password?</a>
                    </div>

                    <Link href="/check-in" className="block mt-6">
                        <button type="button" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors">
                            Sign In
                        </button>
                    </Link>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Don&apos;t have an account? <a href="/register?role=athlete" className="text-cyan-400 hover:underline">Register here</a>
                </div>
            </div>
        </main>
    );
}
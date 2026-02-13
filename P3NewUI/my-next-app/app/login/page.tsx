import Link from 'next/link';
import { User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    return (
        <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6">

            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Identify User</h1>
                <p className="text-slate-400">Select your role to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                {/* OPTION 1: ATHLETE (Cyan Theme) */}
                <Link href="/check-in" className="group relative">
                    <div className="h-64 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:border-cyan-500 group-hover:bg-slate-800 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] cursor-pointer">
                        <div className="p-4 bg-cyan-500/10 rounded-full group-hover:bg-cyan-500/20 transition-colors">
                            <User className="w-12 h-12 text-cyan-400" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">Team Member</h2>
                            <p className="text-slate-500 text-sm mt-1">Daily Readiness Check-In</p>
                        </div>
                    </div>
                </Link>

                {/* OPTION 2: COACH (Amber Theme - Now Unlocked) */}
                <Link href="/coach" className="group relative">
                    <div className="h-64 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:border-amber-500 group-hover:bg-slate-800 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] cursor-pointer">

                        <div className="p-4 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
                            <ShieldCheck className="w-12 h-12 text-amber-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white group-hover:text-amber-500 transition-colors">Coach Portal</h2>
                            <p className="text-slate-500 text-sm mt-1">Roster & Risk Management</p>
                        </div>
                    </div>
                </Link>

            </div>

            {/* Footer Info */}
            <div className="mt-16 text-slate-600 text-sm font-mono">
                WeaveStream Secure Login // v0.1.0
            </div>

        </main>
    );
}
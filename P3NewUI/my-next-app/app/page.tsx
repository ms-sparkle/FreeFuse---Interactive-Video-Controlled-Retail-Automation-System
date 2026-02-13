import Link from 'next/link';

export default function Home() {
    return (
        <main className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-8">
                WEAVESTREAM
            </h1>
            <p className="text-slate-400 mb-12 text-xl">Athlete Readiness System</p>

            <Link href="/login">
                <button className="px-12 py-6 bg-white text-black text-2xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                    TAP TO START
                </button>
            </Link>
        </main>
    );
}
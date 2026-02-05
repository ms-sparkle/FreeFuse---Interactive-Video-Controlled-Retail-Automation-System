import BodyMap from '../components/BodyMap';

export default function CheckInPage() {
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

                {/* Simple P3 / WeaveStream Logo placeholder */}
                <div className="font-mono text-cyan-500 border border-cyan-500 px-3 py-1 rounded">
                    Member Kiosk
                </div>
            </div>

            {/* The Interactive Component */}
            <div className="w-full max-w-6xl">
                <BodyMap />
            </div>

        </main>
    );
}
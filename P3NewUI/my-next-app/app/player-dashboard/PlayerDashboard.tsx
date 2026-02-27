import { Activity, CalendarDays, Dumbbell, ShieldCheck, Target, TrendingUp } from 'lucide-react';

const recommendations = [
  {
    title: 'Light Exercise',
    level: 'Low',
    description: 'Light work for: Neck',
  },
  {
    title: 'Cardio Training',
    level: 'Medium',
    description: '30 minutes of moderate cardio',
  },
  {
    title: 'Flexibility & Stretching',
    level: 'Low',
    description: 'Full body stretching routine',
  },
];

export default function PlayerDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-cyan-400">Welcome back, user!</h1>
            <p className="text-slate-400 mt-2">Here&apos;s your personalized fitness dashboard</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
            <CalendarDays size={16} className="text-cyan-300" />
            <span className="font-semibold">Today: Feb 23, 2026</span>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-4">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <ShieldCheck size={16} />
            Good Recovery Status
          </div>
          <p className="text-sm text-emerald-200/90 mt-1">Your muscles are recovering well. You can proceed with normal training.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-6">
              <Activity size={18} />
              Personal Information
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Email</span><span>email@place.com</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Sex</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">Male</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Age</span><span>24 years</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Height</span><span>175 cm</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Weight</span><span>70 kg</span></div>
              <hr className="border-slate-800" />
              <div className="flex justify-between"><span className="text-slate-400">BMI</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">22.9</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Model Type</span><span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">Standard</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
              <Dumbbell size={18} />
              Workout Recommendations
            </h2>
            <p className="text-slate-400 mb-6">Based on your current muscle soreness levels</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2lg font-semibold">{item.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${item.level === 'Medium' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-200 border-slate-700'}`}>
                      {item.level}
                    </span>
                  </div>

                  <p className="text-slate-300 mb-4">{item.description}</p>

                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 transition-colors">
                    <Target size={16} />
                    Start Workout
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-cyan-300 mb-1">
            <TrendingUp size={18} />
            Workout Progress
          </h2>
          <p className="text-slate-400 mb-5">Your training activity over the last 7 days</p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:p-5">
            <svg viewBox="0 0 900 260" className="w-full h-auto" role="img" aria-label="Workout progress chart">
              <g stroke="#334155" strokeWidth="1" strokeDasharray="4 4">
                <line x1="50" y1="30" x2="850" y2="30" />
                <line x1="50" y1="84" x2="850" y2="84" />
                <line x1="50" y1="138" x2="850" y2="138" />
                <line x1="50" y1="192" x2="850" y2="192" />
                <line x1="50" y1="246" x2="850" y2="246" />
                <line x1="50" y1="30" x2="50" y2="246" />
                <line x1="183" y1="30" x2="183" y2="246" />
                <line x1="316" y1="30" x2="316" y2="246" />
                <line x1="449" y1="30" x2="449" y2="246" />
                <line x1="582" y1="30" x2="582" y2="246" />
                <line x1="715" y1="30" x2="715" y2="246" />
                <line x1="850" y1="30" x2="850" y2="246" />
              </g>

              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                points="50,120 183,84 316,156 449,46 582,108 715,66 850,30"
              />
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points="50,156 183,138 316,192 449,120 582,156 715,138 850,84"
              />

              {[
                [50, 120],
                [183, 84],
                [316, 156],
                [449, 46],
                [582, 108],
                [715, 66],
                [850, 30],
              ].map(([x, y]) => (
                <circle key={`sessions-${x}`} cx={x} cy={y} r="3.5" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
              ))}
              {[
                [50, 156],
                [183, 138],
                [316, 192],
                [449, 120],
                [582, 156],
                [715, 138],
                [850, 84],
              ].map(([x, y]) => (
                <circle key={`duration-${x}`} cx={x} cy={y} r="3.5" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
              ))}

              <g fill="#94a3b8" fontSize="12">
                <text x="18" y="250">0</text>
                <text x="18" y="196">2</text>
                <text x="18" y="142">4</text>
                <text x="18" y="88">6</text>
                <text x="18" y="34">8</text>

                <text x="856" y="250">0</text>
                <text x="856" y="196">20</text>
                <text x="856" y="142">40</text>
                <text x="856" y="88">60</text>
                <text x="856" y="34">80</text>

                <text x="38" y="16">Sessions</text>
                <text x="850" y="16">Duration (min)</text>

                <text x="40" y="262">Feb 16</text>
                <text x="173" y="262">Feb 17</text>
                <text x="306" y="262">Feb 18</text>
                <text x="439" y="262">Feb 19</text>
                <text x="572" y="262">Feb 20</text>
                <text x="705" y="262">Feb 21</text>
                <text x="838" y="262">Feb 23</text>
              </g>
            </svg>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
              <div className="text-center">
                <div className="text-3xl font-semibold text-cyan-300">27</div>
                <div className="text-sm text-slate-400">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-semibold text-cyan-300">405</div>
                <div className="text-sm text-slate-400">Total Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-semibold text-cyan-300">58</div>
                <div className="text-sm text-slate-400">Avg Minutes/Session</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-cyan-300 mb-1">Current Muscle Soreness</h2>
          <p className="text-slate-400 mb-5">Overview of your rated muscle groups</p>

          <div className="max-w-sm rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex items-center justify-between">
            <span className="text-white">Neck</span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-sm">5/10</span>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";
import { Activity, CalendarDays, Dumbbell, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// placeholder for dynamic data pulling in
// will need to splice data to most recent 7 days for the graph
const data = [
  { day: 'Feb 16', sessions: 4, duration: 40 },
  { day: 'Feb 17', sessions: 6, duration: 50 },
  { day: 'Feb 18', sessions: 3, duration: 25 },
  { day: 'Feb 19', sessions: 4, duration: 40 },
  { day: 'Feb 21', sessions: 6, duration: 51 },
  { day: 'Feb 22', sessions: 3, duration: 24 },
  { day: 'Feb 23', sessions: 4, duration: 40 },
  { day: 'Feb 24', sessions: 6, duration: 45 },
  { day: 'Feb 25', sessions: 3, duration: 22 },
];

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
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                
                {/* THIS IS THE HOVER MAGIC */}
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#06b6d4" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#06b6d4' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1' }} 
                />
              </LineChart>
            </ResponsiveContainer>
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

// Usage in CoachDashboard.tsx:
//   import RestrictWorkouts from '../components/RestrictWorkouts';
//   <RestrictWorkouts athleteId={selectedId} coachId={coachPersonId} />
//
// The workouts.json file at /data/workouts.json is used for muscle-group bans.
// DB workouts come from the WORKOUT table via /api/coach/workout-bans.

"use client";
import { useEffect, useRef, useState } from "react";
import { Ban, Plus, Trash2, X, CalendarDays, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkoutBan = {
  BanID: number;
  BanType: "workout" | "muscle";
  WorkoutID: number | null;
  MuscleGroup: string | null;
  ExpirationDate: string | null;
  CreatedDate: string;
  WorkoutName: string | null;
  CoachName: string;
};

type DbWorkout = {
  WorkoutID: number;
  WorkoutName: string;
  BodyPartName: string;
};

// Muscle groups extracted from workouts.json primary_nodes / secondary_nodes
const MUSCLE_GROUPS = [
  "Pectorals / Shoulders",
  "Abs / Obliques",
  "Neck / Traps",
  "Mid-Back / Lats",
  "Quadriceps / Hamstrings",
  "Calves / Ankles",
];

// ─── Searchable dropdown ──────────────────────────────────────────────────────

function SearchableDropdown<T>({
  items,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder,
}: {
  items: T[];
  value: string | number | null;
  onChange: (val: string | number | null, item: T | null) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = value !== null ? items.find((i) => getValue(i) === value) : null;

  const filtered = items.filter((i) =>
    getLabel(i).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:border-cyan-500 hover:border-slate-500 transition-colors"
      >
        <span className={selected ? "text-white" : "text-slate-500"}>
          {selected ? getLabel(selected) : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-slate-500 text-sm">No matches</li>
            )}
            {filtered.map((item) => (
              <li key={String(getValue(item))}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(getValue(item), item);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors
                    ${getValue(item) === value ? "text-cyan-400 bg-slate-700/60" : "text-slate-200"}`}
                >
                  {getLabel(item)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());

  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayStr = today.toISOString().slice(0, 10);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prev} className="text-slate-400 hover:text-white px-1 text-sm transition-colors">‹</button>
        <span className="text-xs font-semibold text-slate-300">{MONTH_NAMES[month]} {year}</span>
        <button type="button" onClick={next} className="text-slate-400 hover:text-white px-1 text-sm transition-colors">›</button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-[9px] text-slate-600 font-medium">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast  = dateStr < todayStr;
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onChange(isSelected ? null : dateStr)}
              className={`text-[11px] h-6 w-full rounded transition-colors
                ${isPast ? "text-slate-700 cursor-not-allowed" : ""}
                ${isSelected ? "bg-cyan-500 text-black font-bold" : ""}
                ${isToday && !isSelected ? "ring-1 ring-cyan-500 text-cyan-400" : ""}
                ${!isPast && !isSelected ? "text-slate-300 hover:bg-slate-700" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Ban Modal ────────────────────────────────────────────────────────────

function AddBanModal({
  dbWorkouts,
  onClose,
  onSave,
}: {
  dbWorkouts: DbWorkout[];
  onClose: () => void;
  onSave: (payload: {
    banType: "workout" | "muscle";
    workoutId: number | null;
    muscleGroup: string | null;
    expirationDate: string | null;
  }) => Promise<void>;
}) {
  const [banType, setBanType]           = useState<"workout" | "muscle">("workout");
  const [workoutId, setWorkoutId]       = useState<number | null>(null);
  const [muscleGroup, setMuscleGroup]   = useState<string | null>(null);
  const [noExpiry, setNoExpiry]         = useState(true);
  const [expirationDate, setExpiration] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const muscleItems = MUSCLE_GROUPS.map((m) => ({ label: m, value: m }));

  const canSave =
    (banType === "workout" && workoutId !== null) ||
    (banType === "muscle" && muscleGroup !== null);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        banType,
        workoutId: banType === "workout" ? workoutId : null,
        muscleGroup: banType === "muscle" ? muscleGroup : null,
        expirationDate: noExpiry ? null : expirationDate,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save ban.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            <Ban className="text-red-400" size={16} />
            Add Workout Restriction
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Ban type toggle */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Restrict by
            </label>
            <div className="flex gap-2">
              {(["workout", "muscle"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setBanType(type); setWorkoutId(null); setMuscleGroup(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all
                    ${banType === type
                      ? "bg-cyan-600 border-cyan-500 text-black"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                >
                  {type === "workout" ? "Specific Workout" : "Muscle Group"}
                </button>
              ))}
            </div>
          </div>

          {/* Workout selector */}
          {banType === "workout" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Select Workout
              </label>
              <SearchableDropdown
                items={dbWorkouts}
                value={workoutId}
                onChange={(val) => setWorkoutId(val as number | null)}
                getLabel={(w) => `${w.WorkoutName} (${w.BodyPartName})`}
                getValue={(w) => w.WorkoutID}
                placeholder="Search workouts…"
              />
            </div>
          )}

          {/* Muscle group selector */}
          {banType === "muscle" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Ban workouts that target
              </label>
              <SearchableDropdown
                items={muscleItems}
                value={muscleGroup}
                onChange={(val) => setMuscleGroup(val as string | null)}
                getLabel={(m) => m.label}
                getValue={(m) => m.value}
                placeholder="Select muscle group…"
              />
              {muscleGroup && (
                <p className="text-xs text-slate-500 mt-2">
                  All workouts targeting <span className="text-cyan-400">{muscleGroup}</span> (primary &amp; secondary) will be restricted.
                </p>
              )}
            </div>
          )}

          {/* Expiration */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
              Expiration
            </label>
            <label className="flex items-center gap-2 mb-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={noExpiry}
                onChange={(e) => { setNoExpiry(e.target.checked); if (e.target.checked) setExpiration(null); }}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">No expiration</span>
            </label>

            {!noExpiry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {expirationDate
                      ? `Expires: ${expirationDate}`
                      : "Click a date to set expiration"}
                  </span>
                  {expirationDate && (
                    <button
                      type="button"
                      onClick={() => setExpiration(null)}
                      className="text-xs text-slate-500 hover:text-red-400 ml-auto transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <MiniCalendar value={expirationDate} onChange={setExpiration} />
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex gap-3 sticky bottom-0 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold text-sm transition-colors"
          >
            {saving ? "Saving…" : "Restrict Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RestrictWorkouts({
  athleteId,
  coachId,
}: {
  athleteId: number;
  coachId: number;
}) {
  const [bans, setBans]               = useState<WorkoutBan[]>([]);
  const [dbWorkouts, setDbWorkouts]   = useState<DbWorkout[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [confirmBanId, setConfirmBanId] = useState<number | null>(null);

  // Load bans + workout list whenever the selected athlete changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/coach/workout-bans?athleteId=${athleteId}`).then(r => r.json()),
      fetch("/api/exercises").then(r => r.ok ? r.json() : { exercises: [] }),
    ])
      .then(([bansData, exData]) => {
        setBans(bansData.bans ?? []);
        // Map exercises endpoint shape → DbWorkout shape
        const mapped: DbWorkout[] = (exData.exercises ?? []).map((e: { ExerciseID: number; Name: string; TargetMuscle: string }) => ({
          WorkoutID: e.ExerciseID,
          WorkoutName: e.Name,
          BodyPartName: e.TargetMuscle,
        }));
        setDbWorkouts(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [athleteId]);

  async function handleAddBan(payload: {
    banType: "workout" | "muscle";
    workoutId: number | null;
    muscleGroup: string | null;
    expirationDate: string | null;
  }) {
    const res = await fetch("/api/coach/workout-bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        athleteId,
        coachId,
        ...payload,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to add ban");
    setBans((prev) => [data.ban, ...prev]);
  }

  async function handleRemoveBan(banId: number) {
    const res = await fetch("/api/coach/workout-bans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banId }),
    });
    if (!res.ok) return;
    setBans((prev) => prev.filter((b) => b.BanID !== banId));
    setConfirmBanId(null);
  }

  function banLabel(ban: WorkoutBan): string {
    if (ban.BanType === "workout") return ban.WorkoutName ?? `Workout #${ban.WorkoutID}`;
    return `${ban.MuscleGroup} (muscle group)`;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-slate-400 text-sm uppercase font-bold flex items-center gap-2">
          <Ban size={14} className="text-red-400" />
          Restrict Workouts
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold transition-colors"
        >
          <Plus size={13} />
          Add Restriction
        </button>
      </div>

      {/* Ban list */}
      <div className="min-h-[80px] bg-slate-950 rounded-xl border border-slate-800/50 p-3 flex flex-col gap-2">
        {loading ? (
          <p className="text-slate-600 text-xs text-center mt-4">Loading…</p>
        ) : bans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-16 text-slate-600 text-xs gap-1">
            <Ban size={20} className="opacity-30" />
            No restricted workouts
          </div>
        ) : (
          bans.map((ban) => (
            <div
              key={ban.BanID}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-red-900/40 bg-red-950/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300 truncate">{banLabel(ban)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {ban.BanType === "muscle" ? "Muscle group ban · " : "Workout ban · "}
                  {ban.ExpirationDate
                    ? `Expires ${ban.ExpirationDate}`
                    : "No expiration"}
                  {" · "}{ban.CoachName}
                </p>
              </div>

              {/* Confirm remove inline */}
              {confirmBanId === ban.BanID ? (
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-[10px] text-slate-400 max-w-[120px] leading-tight">
                    Remove {ban.BanType === "muscle" ? "muscle group" : "workout"} ban?
                  </span>
                  <button
                    onClick={() => handleRemoveBan(ban.BanID)}
                    className="text-[10px] px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                  >
                    Yes, remove
                  </button>
                  <button
                    onClick={() => setConfirmBanId(null)}
                    className="text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmBanId(ban.BanID)}
                  className="ml-3 shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Remove restriction"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add ban modal */}
      {showModal && (
        <AddBanModal
          dbWorkouts={dbWorkouts}
          onClose={() => setShowModal(false)}
          onSave={handleAddBan}
        />
      )}
    </div>
  );
}
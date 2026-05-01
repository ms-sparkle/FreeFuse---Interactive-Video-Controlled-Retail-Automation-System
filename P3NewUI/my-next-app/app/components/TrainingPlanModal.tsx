"use client";
import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, AlertTriangle, CheckCircle2, Dumbbell, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JsonWorkout = {
  name: string;
  type: string;
  primary_nodes: string[];
  secondary_nodes: string[];
};

type WorkoutSuggestion = {
  WorkoutName: string;
  Duration: number;
  Reps: number;
  BodyPartName: string;
};

// ─── Searchable dropdown (same pattern as RestrictWorkouts) ───────────────────

function SearchableDropdown({
  items,
  value,
  onChange,
}: {
  items: JsonWorkout[];
  value: JsonWorkout | null;
  onChange: (item: JsonWorkout | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.primary_nodes.some((n) => n.toLowerCase().includes(query.toLowerCase()))
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
        className="w-full flex items-center justify-between bg-[#2a1200] border border-amber-800/60 rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none focus:border-amber-500 hover:border-amber-700 transition-colors"
      >
        <span className={value ? "text-yellow-50" : "text-yellow-50/40"}>
          {value ? value.name : "Search workouts…"}
        </span>
        <ChevronDown size={14} className={`text-yellow-50/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#2a1200] border border-amber-800/60 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-amber-800/60">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="w-full bg-[#120700] border border-amber-800/60 rounded px-3 py-1.5 text-sm text-yellow-50 placeholder-yellow-50/40 focus:outline-none focus:border-amber-500"
            />
          </div>
          <ul className="max-h-32 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-yellow-50/50 text-sm">No matches</li>
            )}
            {filtered.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => { onChange(item); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-amber-900/40 transition-colors border-b border-amber-800/30 last:border-0
                    ${value?.name === item.name ? "text-amber-400 bg-amber-900/40" : "text-yellow-50"}`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-yellow-50/40 text-xs ml-2">· {item.type}</span>
                  <div className="text-[10px] text-yellow-50/40 mt-0.5">{item.primary_nodes.join(", ")}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Workout preview card (shown after selection) ─────────────────────────────

function WorkoutPreview({ workout }: { workout: JsonWorkout }) {
  return (
    <div className="rounded-xl border border-amber-800/50 bg-[#2a1200]/60 p-4 mt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-yellow-50 text-sm">{workout.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300">
            {workout.type}
          </span>
        </div>
        <Dumbbell size={18} className="text-amber-400 shrink-0 mt-0.5" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div>
          <p className="text-[10px] font-bold text-yellow-50/50 uppercase tracking-widest mb-1">Primary muscles</p>
          <div className="flex flex-wrap gap-1">
            {workout.primary_nodes.map((m) => (
              <span key={m} className="px-2 py-0.5 rounded bg-amber-900/40 border border-amber-800/40 text-xs text-yellow-50">{m}</span>
            ))}
          </div>
        </div>
        {workout.secondary_nodes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-yellow-50/50 uppercase tracking-widest mb-1">Secondary muscles</p>
            <div className="flex flex-wrap gap-1">
              {workout.secondary_nodes.map((m) => (
                <span key={m} className="px-2 py-0.5 rounded bg-amber-900/20 border border-amber-800/30 text-xs text-yellow-50/70">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function AddToTrainingPlanModal({
  athleteId,
  allWorkouts,
  preselected,
  onClose,
  onSuccess,
}: {
  athleteId: number;
  allWorkouts: JsonWorkout[];
  preselected: JsonWorkout | null;
  onClose: () => void;
  onSuccess: (workoutName: string) => void;
}) {
  const [selected, setSelected] = useState<JsonWorkout | null>(preselected);
  const [submitting, setSubmitting] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setBanError(null);

    try {
      const res = await fetch("/api/coach/training-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          workoutName: selected.name,
          primaryNodes: selected.primary_nodes,
          secondaryNodes: selected.secondary_nodes,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Ban conflict — show the warning, do NOT close
        setBanError(data.error);
        return;
      }

      if (!res.ok) {
        setBanError(data.error ?? "Failed to add workout.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(selected.name);
        onClose();
      }, 1000);
    } catch {
      setBanError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a0c00] border border-amber-800/50 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-amber-800/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-amber-400" size={16} />
            Add workout to training plan
          </h3>
          <button onClick={onClose} className="text-yellow-50/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-visible space-y-4">
          <div>
            <label className="text-xs font-bold text-yellow-50/60 uppercase tracking-widest mb-2 block">
              Select Workout
            </label>
            <SearchableDropdown
              items={allWorkouts}
              value={selected}
              onChange={(item) => { setSelected(item); setBanError(null); }}
            />
          </div>

          {/* Preview */}
          {selected && <WorkoutPreview workout={selected} />}

          {/* Ban warning */}
          {banError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-700/60 bg-red-950/40 px-4 py-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Workout Restricted</p>
                <p className="text-xs text-red-400/80 mt-0.5">{banError}</p>
                <p className="text-xs text-yellow-50/50 mt-1">
                  Remove the restriction in the &quot;Restrict Workouts&quot; section before adding this workout.
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-950/30 px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">Added to training plan!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-amber-800/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-amber-800/60 text-yellow-50/70 hover:text-white hover:border-amber-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || submitting || success}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-bold text-sm transition-colors"
          >
            {submitting ? "Adding…" : success ? "Added!" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workout suggestion card with hover overlay ───────────────────────────────
// Replace the existing workout suggestion map in CoachDashboard.tsx with this.

export function WorkoutSuggestionCard({
  workout,
  athleteId,
  allWorkouts,
  onSuccess,
}: {
  workout: WorkoutSuggestion;
  athleteId: number;
  allWorkouts: JsonWorkout[];
  onSuccess?: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Try to find the matching JSON workout so the modal pre-populates it
  const matched = allWorkouts.find(
    (w) => w.name.toLowerCase() === workout.WorkoutName.toLowerCase()
  ) ?? null;

  function handleSuccess(_name: string) {
    onSuccess?.();
  }

  return (
    <>
      <div
        className="relative flex items-center gap-3 text-white bg-[#2a1200] p-3 rounded border-l-4 border-amber-600 group overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Normal content */}
        <div className={`flex items-center gap-3 flex-1 transition-opacity duration-150 ${hovered ? "opacity-30" : "opacity-100"}`}>
          <div className="flex-1">
            <div className="font-bold text-amber-400">{workout.WorkoutName}</div>
            <div className="text-xs text-yellow-50/50">
              Targets: {workout.BodyPartName} · {workout.Duration} min
            </div>
          </div>
          <div className="font-mono text-sm">{workout.Reps} reps</div>
        </div>

        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 animate-in fade-in duration-150">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition-colors shadow-lg"
            >
              <Plus size={13} />
              Add workout
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddToTrainingPlanModal
          athleteId={athleteId}
          allWorkouts={allWorkouts}
          preselected={matched}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
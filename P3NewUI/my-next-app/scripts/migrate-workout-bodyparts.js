/**
 * Migration: WORKOUT_BODYPART junction table
 *
 * 1. Creates WORKOUT_BODYPART(WorkoutID, BodyPartID, IsPrimary)
 * 2. Migrates the 6 existing WORKOUT rows into the junction table
 * 3. Inserts workouts from data/workouts.json (skips name-duplicates)
 * 4. Inserts junction rows for primary_nodes (IsPrimary=1)
 *    and secondary_nodes (IsPrimary=0) for each workout
 */

const Database = require('better-sqlite3');
const path = require('path');
const workoutsData = require('../data/workouts.json');

const db = new Database(path.join(__dirname, '../data/capstone.db'));
db.pragma('foreign_keys = OFF');

// ── 1. Create junction table ──────────────────────────────────────────────────
db.prepare(`
  CREATE TABLE IF NOT EXISTS WORKOUT_BODYPART (
    WorkoutID  INTEGER NOT NULL,
    BodyPartID INTEGER NOT NULL,
    IsPrimary  INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (WorkoutID, BodyPartID),
    FOREIGN KEY (WorkoutID)  REFERENCES WORKOUT(WorkoutID),
    FOREIGN KEY (BodyPartID) REFERENCES BODYPART(BodyPartID)
  )
`).run();
console.log('✓ WORKOUT_BODYPART table ready');

// ── 2. Migrate existing WORKOUT rows ─────────────────────────────────────────
const existing = db.prepare(
  'SELECT WorkoutID, BodyPartID FROM WORKOUT WHERE BodyPartID IS NOT NULL'
).all();

const insertPrimary = db.prepare(
  'INSERT OR IGNORE INTO WORKOUT_BODYPART (WorkoutID, BodyPartID, IsPrimary) VALUES (?, ?, 1)'
);
const insertSecondary = db.prepare(
  'INSERT OR IGNORE INTO WORKOUT_BODYPART (WorkoutID, BodyPartID, IsPrimary) VALUES (?, ?, 0)'
);

const migrateExisting = db.transaction(() => {
  for (const row of existing) insertPrimary.run(row.WorkoutID, row.BodyPartID);
});
migrateExisting();
console.log(`✓ Migrated ${existing.length} existing WORKOUT rows into junction table`);

// ── 3. Muscle-group → BodyPartID mapping ─────────────────────────────────────
// Each compound group maps to one or more BODYPART rows. Primary uses N/A side
// where available, otherwise Left.
const nodeToBodyPartIds = {
  'Pectorals / Shoulders':   [15, 18],  // Chest N/A, Deltoids N/A
  'Abs / Obliques':          [1,  37],  // Abs Left, Obliques Left
  'Neck / Traps':            [36, 46],  // Neck N/A, Trapezius N/A
  'Mid-Back / Lats':         [50, 51],  // Upper Back Left, Upper Back Right
  'Quadriceps / Hamstrings': [39, 25],  // Quadriceps Left, Hamstring Left
  'Calves / Ankles':         [11,  6],  // Calves Left, Ankles Left
};

// Default Duration/Reps by exercise type
const typeDefaults = {
  Strength:   { duration: 30, reps: 10 },
  Core:       { duration: 20, reps: 15 },
  Plyometric: { duration: 25, reps: 12 },
  Cardio:     { duration: 45, reps: null },
};

// ── 4. Insert workouts from workouts.json ─────────────────────────────────────
const getByName    = db.prepare('SELECT WorkoutID FROM WORKOUT WHERE WorkoutName = ?');
const insertWorkout = db.prepare(
  'INSERT INTO WORKOUT (WorkoutName, Duration, Reps) VALUES (?, ?, ?)'
);

const insertAll = db.transaction(() => {
  let inserted = 0, skipped = 0, junctionRows = 0;

  for (const exercise of workoutsData.exercises) {
    // Resolve or create the WORKOUT row
    let row = getByName.get(exercise.name);
    let workoutId;
    if (row) {
      workoutId = row.WorkoutID;
      skipped++;
    } else {
      const defaults = typeDefaults[exercise.type] || { duration: 30, reps: 10 };
      const result = insertWorkout.run(exercise.name, defaults.duration, defaults.reps);
      workoutId = result.lastInsertRowid;
      inserted++;
    }

    // Insert primary body parts (IsPrimary=1)
    for (const node of exercise.primary_nodes) {
      const ids = nodeToBodyPartIds[node] || [];
      for (const bpId of ids) {
        insertPrimary.run(workoutId, bpId);
        junctionRows++;
      }
    }

    // Insert secondary body parts (IsPrimary=0); OR IGNORE skips if already primary
    for (const node of exercise.secondary_nodes) {
      const ids = nodeToBodyPartIds[node] || [];
      for (const bpId of ids) {
        insertSecondary.run(workoutId, bpId);
        junctionRows++;
      }
    }
  }

  console.log(`✓ Workouts inserted: ${inserted}, skipped (already exist): ${skipped}`);
  console.log(`✓ WORKOUT_BODYPART rows attempted: ${junctionRows}`);
});

insertAll();

db.pragma('foreign_keys = ON');

// ── Verify ────────────────────────────────────────────────────────────────────
const workoutCount  = db.prepare('SELECT COUNT(*) as c FROM WORKOUT').get().c;
const junctionCount = db.prepare('SELECT COUNT(*) as c FROM WORKOUT_BODYPART').get().c;
console.log(`\nFinal counts  — WORKOUT: ${workoutCount}  |  WORKOUT_BODYPART: ${junctionCount}`);

const sample = db.prepare(`
  SELECT w.WorkoutName,
         GROUP_CONCAT(CASE WHEN wb.IsPrimary=1 THEN bp.BodyPartName END) AS Primary,
         GROUP_CONCAT(CASE WHEN wb.IsPrimary=0 THEN bp.BodyPartName END) AS Secondary
  FROM WORKOUT w
  JOIN WORKOUT_BODYPART wb ON wb.WorkoutID = w.WorkoutID
  JOIN BODYPART bp          ON bp.BodyPartID = wb.BodyPartID
  GROUP BY w.WorkoutID
  LIMIT 10
`).all();
console.log('\nSample (first 10 workouts):');
console.table(sample);

db.close();

export function generateRecommendations(
  soreness: any[],
  workouts: any[] | undefined
) {
  if (!workouts || workouts.length === 0) return [];

  const HIGH = 7;
  const MEDIUM = 5;

  const normalize = (name: string) =>
    name.toLowerCase().split('/').map(s => s.trim());

  // HIGH soreness need to fully restrict
  const highRestricted = soreness
    .filter(s => s.SorenessLevel >= HIGH)
    .flatMap(s => normalize(s.BodyPartName));

  // MEDIUM soreness need to try to avoid if possible
  const mediumRestricted = soreness
    .filter(s => s.SorenessLevel >= MEDIUM && s.SorenessLevel < HIGH)
    .flatMap(s => normalize(s.BodyPartName));

 
  // STEP 1: Remove HIGH risk
  let safe = workouts.filter(w => {
    const targets = normalize(w.BodyPartName);
    return !targets.some(t => highRestricted.includes(t));
  });

 
  // STEP 2: Prefer recovery
  const recoveryKeywords = ['mobility', 'stretch', 'recovery', 'light'];

  let prioritized = safe.sort((a, b) => {
    const aRecovery = recoveryKeywords.some(k =>
      a.WorkoutName.toLowerCase().includes(k)
    );
    const bRecovery = recoveryKeywords.some(k =>
      b.WorkoutName.toLowerCase().includes(k)
    );

    return Number(bRecovery) - Number(aRecovery);
  });

  // STEP 3: Soft filter medium soreness
  prioritized = prioritized.filter(w => {
    const targets = normalize(w.BodyPartName);
    return !targets.some(t => mediumRestricted.includes(t));
  });

  // STEP 4: Add reasoning (important for UI/debugging)
  return prioritized.slice(0, 5).map(w => ({
    ...w,
    Reason: 'Selected to avoid high-soreness muscle groups'
  }));
}
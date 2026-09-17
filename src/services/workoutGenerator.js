// Rule-based workout program drafter. No AI call needed for this one — it's a
// deterministic template system, which keeps it fast, offline, and predictable
// (a real LLM-based "make my workout shorter today" assistant is a natural
// future upgrade — see spec §47 — but the baseline generator should not
// depend on a network call).

import { EXERCISES } from '../data/exerciseDatabase.js';

const SPLITS = {
  2: [['full_body_a'], ['full_body_b']],
  3: [['full_body_a'], ['full_body_b'], ['full_body_c']],
  4: [['upper_a'], ['lower_a'], ['upper_b'], ['lower_b']],
  5: [['push'], ['pull'], ['legs'], ['upper'], ['lower']],
  6: [['push'], ['pull'], ['legs'], ['push'], ['pull'], ['legs']]
};

const DAY_LABELS = {
  full_body_a: 'Full Body A',
  full_body_b: 'Full Body B',
  full_body_c: 'Full Body C',
  upper_a: 'Upper A',
  upper_b: 'Upper B',
  lower_a: 'Lower A',
  lower_b: 'Lower B',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower'
};

// Which muscle groups each day type draws exercises from, roughly ordered
// compound-to-isolation.
const DAY_MUSCLES = {
  full_body_a: ['quads', 'back', 'chest', 'shoulders', 'core'],
  full_body_b: ['hamstrings', 'chest', 'back', 'biceps', 'triceps'],
  full_body_c: ['glutes', 'shoulders', 'back', 'core', 'calves'],
  upper_a: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  upper_b: ['back', 'chest', 'shoulders', 'triceps', 'biceps'],
  lower_a: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  lower_b: ['hamstrings', 'quads', 'glutes', 'calves', 'core'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'core']
};

function repRangeFor(goal, exerciseIndex) {
  // First 1-2 exercises of a day are the "main lift" for the muscle group.
  const isMain = exerciseIndex === 0;
  if (goal === 'gain_muscle' || goal === 'recomposition') return isMain ? '6-8' : '10-15';
  if (goal === 'lose_fat') return isMain ? '8-10' : '12-15';
  return isMain ? '5-8' : '8-12'; // gain_weight / maintain / custom
}

function setsFor(experience) {
  if (experience === 'beginner') return 3;
  if (experience === 'intermediate') return 3;
  return 4; // advanced
}

function pickExercises(muscleGroups, equipment, perMuscle = 1) {
  const chosen = [];
  const used = new Set();
  for (const muscle of muscleGroups) {
    const pool = EXERCISES.filter(
      (e) => e.primaryMuscle === muscle && (equipment.includes(e.equipment) || e.equipment === 'bodyweight') && !used.has(e.name)
    );
    const picks = pool.slice(0, perMuscle);
    picks.forEach((p) => {
      used.add(p.name);
      chosen.push(p);
    });
  }
  return chosen;
}

/**
 * @param {{goal, experience, daysPerWeek, durationMinutes, equipment: string[]}} prefs
 */
export function generateProgram(prefs) {
  const { goal = 'maintain', experience = 'beginner', daysPerWeek = 3, durationMinutes = 45, equipment = ['bodyweight'] } = prefs;
  const days = SPLITS[daysPerWeek] || SPLITS[3];
  const exercisesPerDay = durationMinutes <= 30 ? 4 : durationMinutes <= 50 ? 5 : 6;

  const program = days.map(([dayKey], i) => {
    const muscles = DAY_MUSCLES[dayKey];
    const perMuscle = Math.max(1, Math.round(exercisesPerDay / muscles.length));
    const picked = pickExercises(muscles, equipment, perMuscle).slice(0, exercisesPerDay);

    return {
      dayIndex: i + 1,
      label: DAY_LABELS[dayKey],
      exercises: picked.map((ex, idx) => ({
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
        sets: setsFor(experience),
        reps: repRangeFor(goal, idx)
      }))
    };
  });

  return {
    name: `${daysPerWeek}-Day ${daysPerWeek <= 3 ? 'Full Body' : daysPerWeek <= 4 ? 'Upper/Lower' : 'Push/Pull/Legs'} Split`,
    goal,
    experience,
    daysPerWeek,
    durationMinutes,
    equipment,
    days: program,
    createdAt: new Date().toISOString()
  };
}

/** Suggests next-session weight/reps from the last logged performance. */
export function suggestProgression(lastSets, goal = 'maintain') {
  if (!lastSets || lastSets.length === 0) return null;
  const best = lastSets.reduce((a, b) => (b.weight * b.reps > a.weight * a.reps ? b : a));
  const allHitTop = lastSets.every((s) => s.reps >= (s.targetRepsHigh || s.reps));

  if (allHitTop) {
    const increment = best.weight >= 60 ? 2.5 : 1.25;
    return { weight: Math.round((best.weight + increment) * 2) / 2, reps: `${Math.max(best.reps - 2, 5)}-${best.reps}`, note: 'Hit the top of your range last time — try a small weight increase.' };
  }
  return { weight: best.weight, reps: `${best.reps + 1}`, note: 'Aim for one more rep than last time at the same weight.' };
}

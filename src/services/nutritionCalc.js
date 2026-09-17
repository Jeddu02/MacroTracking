// All calculation logic lives here, isolated from UI, so the assumptions are
// easy to find, audit and adjust in one place.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // little/no exercise
  light: 1.375, // light exercise 1-3 days/week
  moderate: 1.55, // moderate exercise 3-5 days/week
  active: 1.725, // hard exercise 6-7 days/week
  very_active: 1.9 // physical job + training
};

const GOAL_CALORIE_ADJUSTMENT = {
  lose_fat: -0.2, // ~20% deficit
  maintain: 0,
  gain_muscle: 0.1, // ~10% surplus (lean bulk)
  gain_weight: 0.2,
  recomposition: -0.05, // small deficit, protein held high
  custom: 0
};

/** Mifflin-St Jeor BMR. weightKg, heightCm, age in years. */
export function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

export function calcTDEE(bmr, activityLevel) {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.375;
  return Math.round(bmr * mult);
}

/**
 * Returns calorie + macro targets in grams, plus the assumptions used so the
 * UI can show its work. Every number here is an estimate, never a prescription.
 */
export function calcTargets({ sex, weightKg, heightCm, age, activityLevel, goal }) {
  const bmr = calcBMR({ sex, weightKg, heightCm, age });
  const tdee = calcTDEE(bmr, activityLevel);
  const adjustment = GOAL_CALORIE_ADJUSTMENT[goal] ?? 0;
  const calories = Math.round(tdee * (1 + adjustment));

  // Protein target scales with bodyweight rather than % of calories, since
  // that's more stable across a cut/bulk. Fat gets a sane floor for hormone
  // health; carbs take the remainder.
  const proteinPerKg = goal === 'lose_fat' || goal === 'recomposition' ? 2.2 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const fatPerKg = 0.8;
  const fat = Math.round(weightKg * fatPerKg);
  const remainingCals = Math.max(calories - protein * 4 - fat * 9, 0);
  const carbs = Math.round(remainingCals / 4);

  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
    assumptions: [
      'Mifflin-St Jeor equation for BMR (most validated for the general population)',
      `Activity multiplier: ${activityLevel.replace('_', ' ')} (${ACTIVITY_MULTIPLIERS[activityLevel]}×)`,
      `Goal adjustment: ${adjustment === 0 ? 'none (maintenance)' : `${Math.round(adjustment * 100)}% vs. maintenance`}`,
      `Protein set at ${proteinPerKg} g/kg bodyweight, fat at ${fatPerKg} g/kg, carbs fill the remainder`,
      'These are estimates for general fitness use, not medical or clinical guidance'
    ]
  };
}

/** US Navy body-fat % method — a measurement-based estimate, not a scan. */
export function calcNavyBodyFat({ sex, heightCm, waistCm, neckCm, hipCm }) {
  if (!waistCm || !neckCm || (sex === 'female' && !hipCm)) return null;
  const heightIn = heightCm / 2.54;
  const waistIn = waistCm / 2.54;
  const neckIn = neckCm / 2.54;
  const hipIn = hipCm ? hipCm / 2.54 : 0;

  let bf;
  if (sex === 'female') {
    bf = 163.205 * Math.log10(waistIn + hipIn - neckIn) - 97.684 * Math.log10(heightIn) - 78.387;
  } else {
    bf = 86.01 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76;
  }
  return Math.max(3, Math.min(60, Math.round(bf * 10) / 10));
}

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);
export const GOALS = Object.keys(GOAL_CALORIE_ADJUSTMENT);

import { db } from './database.js';
import { ALL_SEED_FOODS } from '../data/foodDatabase.js';
import { calcTargets } from '../services/nutritionCalc.js';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Populates realistic demo data so the app isn't empty on first launch (spec §43). */
export async function seedDemoData() {
  const profile = {
    id: 'me',
    name: 'Alex',
    sex: 'male',
    age: 29,
    heightCm: 174,
    weightKg: 78.4,
    goalWeightKg: 72,
    neckCm: 38,
    waistCm: 88,
    activityLevel: 'moderate',
    goal: 'lose_fat',
    experience: 'intermediate',
    daysPerWeek: 4,
    durationMinutes: 50,
    equipment: ['dumbbell', 'barbell', 'cable', 'machine'],
    mealsPerDay: 3,
    dietaryRestrictions: [],
    foodsAvoided: [],
    allergies: [],
    units: 'metric',
    onboardingComplete: true
  };
  const targets = calcTargets(profile);
  await db.put('profile', { ...profile, targets, targetsOverridden: false });

  await db.put('settings', { id: 'app', theme: 'dark', units: 'metric', notifications: true });

  for (const food of ALL_SEED_FOODS) {
    await db.put('foods', food);
  }

  // A few days of food logs
  const sampleMeals = {
    breakfast: [
      { name: 'Fried Egg', serving: 100, unit: 'g', calories: 180, protein: 12, carbs: 1, fat: 14, fiber: 0 },
      { name: 'White Rice', serving: 180, unit: 'g', calories: 234, protein: 4, carbs: 51, fat: 0.5, fiber: 1 },
      { name: 'Coffee (black)', serving: 240, unit: 'ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 }
    ],
    lunch: [
      { name: 'Chicken Adobo', serving: 200, unit: 'g', calories: 380, protein: 28, carbs: 6, fat: 26, fiber: 0.5 },
      { name: 'White Rice', serving: 180, unit: 'g', calories: 234, protein: 4, carbs: 51, fat: 0.5, fiber: 1 }
    ],
    dinner: [
      { name: 'Grilled Chicken Breast', serving: 150, unit: 'g', calories: 248, protein: 46, carbs: 0, fat: 6, fiber: 0 },
      { name: 'Mixed Vegetables', serving: 100, unit: 'g', calories: 45, protein: 2, carbs: 9, fat: 0, fiber: 3 }
    ],
    snacks: [{ name: 'Banana', serving: 118, unit: 'g', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3 }]
  };

  for (let d = 6; d >= 0; d--) {
    const date = daysAgo(d);
    for (const [meal, items] of Object.entries(sampleMeals)) {
      for (const item of items) {
        await db.put('foodLogs', { ...item, date, meal, loggedVia: 'manual' });
      }
    }
  }

  // Weight history trending down slightly
  for (let d = 30; d >= 0; d -= 2) {
    await db.put('bodyWeights', {
      date: daysAgo(d),
      weightKg: Math.round((profile.weightKg + d * 0.04 + (Math.random() * 0.6 - 0.3)) * 10) / 10,
      note: ''
    });
  }

  await db.put('bodyMeasurements', {
    date: daysAgo(0),
    waistCm: 88,
    neckCm: 38,
    chestCm: 102,
    armsCm: 34,
    thighsCm: 58,
    hipsCm: 98,
    calvesCm: 38
  });

  // A completed workout program + one logged session
  const program = {
    name: '4-Day Upper/Lower',
    goal: 'lose_fat',
    experience: 'intermediate',
    daysPerWeek: 4,
    durationMinutes: 50,
    days: [
      {
        dayIndex: 1,
        label: 'Upper A',
        exercises: [
          { name: 'Barbell Bench Press', primaryMuscle: 'chest', equipment: 'barbell', sets: 3, reps: '6-8' },
          { name: 'Lat Pulldown', primaryMuscle: 'back', equipment: 'cable', sets: 3, reps: '8-12' },
          { name: 'Overhead Shoulder Press', primaryMuscle: 'shoulders', equipment: 'dumbbell', sets: 3, reps: '8-10' },
          { name: 'Seated Cable Row', primaryMuscle: 'back', equipment: 'cable', sets: 3, reps: '8-12' },
          { name: 'Bicep Curl', primaryMuscle: 'biceps', equipment: 'dumbbell', sets: 2, reps: '10-15' },
          { name: 'Triceps Pushdown', primaryMuscle: 'triceps', equipment: 'cable', sets: 2, reps: '10-15' }
        ]
      },
      {
        dayIndex: 2,
        label: 'Lower A',
        exercises: [
          { name: 'Back Squat', primaryMuscle: 'quads', equipment: 'barbell', sets: 3, reps: '6-8' },
          { name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', equipment: 'barbell', sets: 3, reps: '8-10' },
          { name: 'Leg Press', primaryMuscle: 'quads', equipment: 'machine', sets: 3, reps: '10-12' },
          { name: 'Leg Curl', primaryMuscle: 'hamstrings', equipment: 'machine', sets: 3, reps: '10-15' },
          { name: 'Standing Calf Raise', primaryMuscle: 'calves', equipment: 'machine', sets: 3, reps: '12-15' }
        ]
      }
    ]
  };
  const savedProgram = await db.put('workoutPrograms', program);

  await db.put('workouts', {
    date: daysAgo(2),
    programId: savedProgram.id,
    dayLabel: 'Upper A',
    durationMinutes: 48,
    completed: true,
    exercises: [
      {
        name: 'Barbell Bench Press',
        sets: [
          { weight: 80, reps: 8, rpe: 8 },
          { weight: 80, reps: 8, rpe: 8 },
          { weight: 80, reps: 7, rpe: 9 }
        ]
      },
      {
        name: 'Lat Pulldown',
        sets: [
          { weight: 60, reps: 10, rpe: 7 },
          { weight: 60, reps: 10, rpe: 8 },
          { weight: 60, reps: 9, rpe: 8 }
        ]
      }
    ]
  });

  await db.put('personalRecords', { exerciseName: 'Barbell Bench Press', weight: 80, reps: 8, estimated1RM: 100, date: daysAgo(2) });
  await db.put('personalRecords', { exerciseName: 'Back Squat', weight: 100, reps: 5, estimated1RM: 116, date: daysAgo(9) });

  await db.put('waterLogs', { date: daysAgo(0), amountMl: 1250, targetMl: 2500 });

  await db.put('habitLogs', {
    date: daysAgo(0),
    habits: { workout: true, protein: true, water: false, sleep: true, steps: true }
  });
}

export async function isFirstLaunch() {
  const profile = await db.get('profile', 'me');
  return !profile;
}

// Seed exercise database. `equipment` is a single primary requirement so the
// generator can filter by what the user has available; bodyweight exercises
// are always eligible.

export const EXERCISES = [
  // Chest
  { name: 'Barbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', difficulty: 'intermediate', pattern: 'push' },
  { name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'push' },
  { name: 'Push-Up', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'core'], equipment: 'bodyweight', difficulty: 'beginner', pattern: 'push' },
  { name: 'Cable Fly', primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'cable', difficulty: 'intermediate', pattern: 'isolation' },
  // Back
  { name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', difficulty: 'beginner', pattern: 'pull' },
  { name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'barbell', difficulty: 'intermediate', pattern: 'pull' },
  { name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', difficulty: 'beginner', pattern: 'pull' },
  { name: 'Pull-Up', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight', difficulty: 'advanced', pattern: 'pull' },
  { name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'pull' },
  // Shoulders
  { name: 'Overhead Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'push' },
  { name: 'Barbell Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell', difficulty: 'intermediate', pattern: 'push' },
  { name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'isolation' },
  // Biceps
  { name: 'Bicep Curl', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'isolation' },
  { name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'barbell', difficulty: 'beginner', pattern: 'isolation' },
  // Triceps
  { name: 'Triceps Pushdown', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'cable', difficulty: 'beginner', pattern: 'isolation' },
  { name: 'Dip', primaryMuscle: 'triceps', secondaryMuscles: ['chest'], equipment: 'bodyweight', difficulty: 'intermediate', pattern: 'push' },
  { name: 'Overhead Triceps Extension', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'isolation' },
  // Quads
  { name: 'Back Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'barbell', difficulty: 'intermediate', pattern: 'squat' },
  { name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'squat' },
  { name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', difficulty: 'beginner', pattern: 'squat' },
  { name: 'Bodyweight Squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'bodyweight', difficulty: 'beginner', pattern: 'squat' },
  // Hamstrings
  { name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', difficulty: 'intermediate', pattern: 'hinge' },
  { name: 'Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', pattern: 'isolation' },
  { name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], equipment: 'dumbbell', difficulty: 'beginner', pattern: 'hinge' },
  // Glutes
  { name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell', difficulty: 'beginner', pattern: 'hinge' },
  { name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'beginner', pattern: 'hinge' },
  // Calves
  { name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', pattern: 'isolation' },
  { name: 'Bodyweight Calf Raise', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'beginner', pattern: 'isolation' },
  // Core
  { name: 'Plank', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'beginner', pattern: 'isometric' },
  { name: 'Hanging Knee Raise', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'intermediate', pattern: 'flexion' },
  { name: 'Cable Crunch', primaryMuscle: 'core', secondaryMuscles: [], equipment: 'cable', difficulty: 'beginner', pattern: 'flexion' }
];

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core'
];

export const EQUIPMENT_OPTIONS = ['bodyweight', 'dumbbell', 'barbell', 'cable', 'machine'];

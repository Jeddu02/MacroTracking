// Seed food database. Values are per typical serving — approximate, editable
// by the user, and clearly not lab-grade (same spirit as every other estimate
// in this app). `source` marks provenance for future filtering/attribution.

export const COMMON_FOODS = [
  { name: 'White Rice', serving: 180, unit: 'g', calories: 234, protein: 4, carbs: 51, fat: 0.5, fiber: 1, source: 'common' },
  { name: 'Fried Egg', serving: 50, unit: 'g', calories: 90, protein: 6, carbs: 0.5, fat: 7, fiber: 0, source: 'common' },
  { name: 'Boiled Egg', serving: 50, unit: 'g', calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, source: 'common' },
  { name: 'Grilled Chicken Breast', serving: 150, unit: 'g', calories: 248, protein: 46, carbs: 0, fat: 6, fiber: 0, source: 'common' },
  { name: 'Bread (slice)', serving: 30, unit: 'g', calories: 79, protein: 3, carbs: 14, fat: 1, fiber: 1, source: 'common' },
  { name: 'Banana', serving: 118, unit: 'g', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, source: 'common' },
  { name: 'Mango', serving: 165, unit: 'g', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 3, source: 'common' },
  { name: 'Milk (1 cup)', serving: 244, unit: 'ml', calories: 122, protein: 8, carbs: 12, fat: 5, fiber: 0, source: 'common' },
  { name: 'Coffee (black)', serving: 240, unit: 'ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, source: 'common' },
  { name: 'Soft Drink', serving: 355, unit: 'ml', calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, source: 'common' },
  { name: 'Mixed Vegetables', serving: 100, unit: 'g', calories: 45, protein: 2, carbs: 9, fat: 0, fiber: 3, source: 'common' },
  { name: 'Tuna (canned in water)', serving: 100, unit: 'g', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, source: 'common' }
];

export const FILIPINO_FOODS = [
  { name: 'Chicken Adobo', serving: 200, unit: 'g', calories: 380, protein: 28, carbs: 6, fat: 26, fiber: 0.5, source: 'filipino' },
  { name: 'Pork Adobo', serving: 200, unit: 'g', calories: 430, protein: 26, carbs: 6, fat: 32, fiber: 0.5, source: 'filipino' },
  { name: 'Sinigang na Baboy', serving: 350, unit: 'g', calories: 310, protein: 22, carbs: 14, fat: 18, fiber: 3, source: 'filipino' },
  { name: 'Chicken Tinola', serving: 350, unit: 'g', calories: 230, protein: 24, carbs: 10, fat: 9, fiber: 2, source: 'filipino' },
  { name: 'Bangus (Milkfish), grilled', serving: 150, unit: 'g', calories: 220, protein: 27, carbs: 0, fat: 12, fiber: 0, source: 'filipino' },
  { name: 'Tilapia, fried', serving: 150, unit: 'g', calories: 210, protein: 26, carbs: 2, fat: 11, fiber: 0, source: 'filipino' },
  { name: 'Sardines (canned, tomato sauce)', serving: 120, unit: 'g', calories: 190, protein: 17, carbs: 4, fat: 12, fiber: 0, source: 'filipino' },
  { name: 'Corned Beef', serving: 100, unit: 'g', calories: 220, protein: 21, carbs: 1, fat: 14, fiber: 0, source: 'filipino' },
  { name: 'Longganisa', serving: 100, unit: 'g', calories: 300, protein: 15, carbs: 8, fat: 23, fiber: 0, source: 'filipino' },
  { name: 'Tocino', serving: 100, unit: 'g', calories: 280, protein: 17, carbs: 12, fat: 18, fiber: 0, source: 'filipino' },
  { name: 'Pancit Canton', serving: 250, unit: 'g', calories: 380, protein: 12, carbs: 55, fat: 12, fiber: 3, source: 'filipino' },
  { name: 'Siomai (4 pcs)', serving: 120, unit: 'g', calories: 260, protein: 14, carbs: 20, fat: 14, fiber: 1, source: 'filipino' },
  { name: 'Lumpiang Shanghai (4 pcs)', serving: 120, unit: 'g', calories: 300, protein: 11, carbs: 22, fat: 19, fiber: 1, source: 'filipino' },
  { name: 'Fried Chicken (1 pc)', serving: 150, unit: 'g', calories: 390, protein: 27, carbs: 14, fat: 25, fiber: 0.5, source: 'filipino' }
];

export const ALL_SEED_FOODS = [...COMMON_FOODS, ...FILIPINO_FOODS];

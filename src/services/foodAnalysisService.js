// foodAnalysisService
// ---------------------------------------------------------------------------
// This is the ONE place the app calls out for AI food recognition. Swap the
// body of `analyzeFoodPhoto` to call a real backend and nothing else in the
// app needs to change — every caller already treats the result as an
// unconfirmed estimate (see FoodResult component) and never auto-saves it.
//
// Response shape (matches spec section 33):
// {
//   foods: [{ name, serving, unit, calories, protein, carbs, fat, fiber, confidence }],
//   source: 'mock' | 'api',
// }
//
// To connect a real model:
//   1. Stand up a backend/serverless endpoint (see /server/analyze-food.js for
//      an example using the Anthropic API) that holds the API key server-side.
//      NEVER call a vision API directly from the browser with an embedded key.
//   2. Replace the body of analyzeFoodPhoto() below with a fetch() to that
//      endpoint, sending the photo as base64 or multipart form data.
//   3. Parse the endpoint's JSON into the same { foods: [...] } shape so the
//      rest of the app (FoodResult, Food page) needs no changes.
// ---------------------------------------------------------------------------

const MOCK_LIBRARY = [
  {
    name: 'Grilled Chicken Breast',
    serving: 150,
    unit: 'g',
    calories: 248,
    protein: 46,
    carbs: 0,
    fat: 6,
    fiber: 0,
    confidence: 0.86
  },
  {
    name: 'White Rice',
    serving: 180,
    unit: 'g',
    calories: 234,
    protein: 4,
    carbs: 51,
    fat: 0.5,
    fiber: 1,
    confidence: 0.9
  },
  {
    name: 'Mixed Vegetables',
    serving: 100,
    unit: 'g',
    calories: 45,
    protein: 2,
    carbs: 9,
    fat: 0,
    fiber: 3,
    confidence: 0.72
  }
];

function jitter(value, pct = 0.08) {
  const delta = value * pct * (Math.random() * 2 - 1);
  return Math.max(0, Math.round((value + delta) * 10) / 10);
}

/**
 * @param {Blob|string} _photo - captured/selected image (unused by the mock)
 * @param {{ signal?: AbortSignal }} [_opts]
 * @returns {Promise<{ foods: Array<object>, source: string }>}
 */
export async function analyzeFoodPhoto(_photo, _opts = {}) {
  // Simulate network + inference latency so the "Analyzing food..." state is real.
  await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 700));

  // Return a plausible 2-3 item plate rather than the same three foods every
  // time, so the mock doesn't feel canned.
  const count = 2 + Math.round(Math.random());
  const picks = [...MOCK_LIBRARY].sort(() => Math.random() - 0.5).slice(0, count);

  return {
    source: 'mock',
    foods: picks.map((item) => ({
      ...item,
      serving: jitter(item.serving, 0.15),
      calories: jitter(item.calories),
      protein: jitter(item.protein),
      carbs: jitter(item.carbs),
      fat: jitter(item.fat),
      fiber: jitter(item.fiber, 0.2)
    }))
  };
}

/** Barcode lookup — same "never trust silently" pattern as photo analysis. */
export async function lookupBarcode(_code) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return null; // not found in the demo; UI falls back to manual entry
}

// foodAnalysisService.js
// ---------------------------------------------------------------------------
// Food image analysis service.
//
// IMPORTANT:
// - No API key belongs in this browser-side file.
// - The browser sends the image to your backend endpoint.
// - The backend is responsible for calling the vision model.
// - The rest of the app receives the same { foods, source } shape.
// ---------------------------------------------------------------------------

const ANALYZE_ENDPOINT = '/api/analyze-food';

/**
 * Convert a Blob/File/data URL into a base64 payload that can be sent
 * to the backend.
 */
async function photoToBase64(photo) {
  if (!photo) {
    throw new Error('No food photo was provided.');
  }

  // Already a data URL.
  if (typeof photo === 'string') {
    if (photo.startsWith('data:')) {
      return photo;
    }

    // If it is a normal URL, download it first.
    const response = await fetch(photo);

    if (!response.ok) {
      throw new Error('Unable to read the selected food photo.');
    }

    const blob = await response.blob();
    return blobToDataUrl(blob);
  }

  // Blob / File from camera or file picker.
  if (photo instanceof Blob) {
    return blobToDataUrl(photo);
  }

  throw new Error('Unsupported photo format.');
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(new Error('Unable to read the food photo.'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Normalize the response from the backend so FoodComponents always receives
 * the exact shape it expects.
 */
function normalizeFood(food) {
  return {
    name: String(food?.name || 'Unknown food'),
    serving: Number(food?.serving) || 0,
    unit: String(food?.unit || 'g'),
    calories: Number(food?.calories) || 0,
    protein: Number(food?.protein) || 0,
    carbs: Number(food?.carbs) || 0,
    fat: Number(food?.fat) || 0,
    fiber: Number(food?.fiber) || 0,
    confidence: Math.min(
      1,
      Math.max(0, Number(food?.confidence) || 0)
    )
  };
}

/**
 * Analyze a food photo.
 *
 * @param {Blob|string} photo
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{foods: Array<object>, source: string}>}
 */
export async function analyzeFoodPhoto(photo, opts = {}) {
  const image = await photoToBase64(photo);

  const response = await fetch(ANALYZE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image
    }),
    signal: opts.signal
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error('The food analysis server returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `Food analysis failed (${response.status}).`
    );
  }

  if (!Array.isArray(data?.foods)) {
    throw new Error('Food analysis returned no usable food results.');
  }

  return {
    source: data.source || 'api',
    foods: data.foods.map(normalizeFood)
  };
}

/**
 * Barcode lookup.
 *
 * Kept separate from photo recognition so the Food page can later support
 * barcode/database lookup without changing its UI architecture.
 */
export async function lookupBarcode(code, opts = {}) {
  if (!code) {
    return null;
  }

  const response = await fetch('/api/lookup-barcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: String(code).trim()
    }),
    signal: opts.signal
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data?.food) {
    return null;
  }

  return normalizeFood(data.food);
}

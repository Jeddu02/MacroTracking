// bodyCompositionService
// ---------------------------------------------------------------------------
// Photo-based body-fat estimation is explicitly experimental (see spec §12/§48).
// This mock NEVER returns a single precise number — only a range + confidence
// + limitations — and real implementations should keep that shape so the UI
// can't accidentally present false precision.
//
// Response shape (matches spec section 34):
// { estimatedRange: { low, high }, confidence: 'low'|'moderate'|'high', limitations: [...] }
// ---------------------------------------------------------------------------

const LIMITATIONS = [
  'Lighting and camera angle affect the visual estimate',
  'Pose and clothing can shift the result by several points',
  'Body-fat distribution varies between individuals and body types',
  'This is not a medical or clinical measurement'
];

/**
 * @param {{ photos: Array<Blob|string>, navyEstimate?: number|null }} input
 */
export async function estimateBodyComposition({ photos = [], navyEstimate = null } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 1600 + Math.random() * 600));

  // Anchor the mock near the measurement-based estimate when available, so the
  // two methods roughly agree in the demo, then widen into a range.
  const center = navyEstimate ?? 20 + Math.random() * 8;
  const spread = photos.length >= 2 ? 2.5 : 4; // more angles -> tighter (still wide) range
  const low = Math.max(4, Math.round((center - spread) * 10) / 10);
  const high = Math.round((center + spread) * 10) / 10;

  return {
    source: 'mock',
    estimatedRange: { low, high },
    confidence: photos.length >= 2 ? 'moderate' : 'low',
    limitations: LIMITATIONS
  };
}

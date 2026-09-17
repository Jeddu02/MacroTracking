// Example serverless function for the experimental body-composition estimate.
// Same pattern as analyze-food.js: key stays server-side, response is always
// a RANGE + confidence + limitations — never a single precise number.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { images, navyEstimate } = req.body || {}; // images: array of base64 strings
  if (!images?.length) {
    res.status(400).json({ error: 'At least one image is required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with an AI API key' });
    return;
  }

  const prompt = `You are giving a rough, non-medical VISUAL estimate of body-fat percentage from photos.
${navyEstimate ? `A measurement-based (US Navy method) estimate of ${navyEstimate}% is also available for context. ` : ''}
Respond with ONLY valid JSON, no prose, matching exactly:
{"estimatedRange":{"low":number,"high":number},"confidence":"low"|"moderate"|"high","limitations":[string,...]}
NEVER return a single precise number — always a range. Keep the range realistic (at least 3-4 points wide).`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((img) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img } })),
              { type: 'text', text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ error: 'AI provider error', detail: text });
      return;
    }

    const data = await response.json();
    const textBlock = data.content?.find((b) => b.type === 'text')?.text || '{}';
    const cleaned = textBlock.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.status(200).json({ source: 'api', ...parsed });
  } catch (err) {
    res.status(500).json({ error: 'Estimation failed', detail: String(err) });
  }
}

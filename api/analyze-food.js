// Example serverless function for real AI food-photo analysis.
// Framework-agnostic-ish: written as a Vercel/Netlify-style handler
// (req.body / res.json). Adapt the export shape to your host if needed
// (e.g. Express: app.post('/api/analyze-food', handler)).
//
// SECURITY: the API key lives ONLY in this server-side env var. It is never
// sent to, or readable by, the browser. See ../.env.example.
//
// Wire this up by pointing src/services/foodAnalysisService.js at this
// endpoint (POST { imageBase64 }) instead of the mock implementation.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image } = req.body || {};
const imageBase64 = image?.includes(',')
  ? image.split(',')[1]
  : image;
  if (!imageBase64) {
  res.status(400).json({ error: 'image is required' });
  return;
}

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with an AI API key' });
    return;
  }

  const prompt = `You are a nutrition estimation assistant. Identify each distinct food item in this photo and
estimate its serving size and macros. Respond with ONLY valid JSON, no prose, matching exactly:
{"foods":[{"name":string,"serving":number,"unit":"g"|"ml"|"piece","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"confidence":number}]}
"confidence" is 0-1. If you cannot identify any food, return {"foods":[]}.`;

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
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
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
    const textBlock = data.content?.find((b) => b.type === 'text')?.text || '{"foods":[]}';
    const cleaned = textBlock.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.status(200).json({ source: 'api', foods: parsed.foods || [] });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', detail: String(err) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = req.body || {};
  const barcode = String(code || '').trim();

  if (!barcode) {
    res.status(400).json({ error: 'Barcode is required' });
    return;
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}?fields=product_name,product_name_en,nutriments,serving_size,quantity,brands,code`,
      {
        headers: {
          'User-Agent': 'MacroFit/1.0 (food tracking app)'
        }
      }
    );

    if (!response.ok) {
      res.status(200).json({ food: null });
      return;
    }

    const data = await response.json();

    if (data?.status !== 1 || !data?.product) {
      res.status(200).json({ food: null });
      return;
    }

    const product = data.product;
    const n = product.nutriments || {};

    const food = {
      name:
        product.product_name ||
        product.product_name_en ||
        'Unknown food',

      serving: 100,
      unit: 'g',

      calories: Number(
        n['energy-kcal_100g'] ??
        n['energy-kcal'] ??
        0
      ),

      protein: Number(
        n['proteins_100g'] ??
        n.proteins ??
        0
      ),

      carbs: Number(
        n['carbohydrates_100g'] ??
        n.carbohydrates ??
        0
      ),

      fat: Number(
        n['fat_100g'] ??
        n.fat ??
        0
      ),

      fiber: Number(
        n['fiber_100g'] ??
        n.fiber ??
        0
      )
    };

    res.status(200).json({
      source: 'openfoodfacts',
      food
    });
  } catch (error) {
    console.error('Barcode lookup failed:', error);

    res.status(200).json({
      food: null
    });
  }
}
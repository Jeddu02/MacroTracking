import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../db/database.js';
import { useApp } from '../context/AppContext.jsx';
import { MacroSummary } from '../components/MacroCard.jsx';
import {
  CameraCapture,
  AnalyzingScreen,
  FoodResultReview,
  MealSection,
  AddFoodModal,
  analyzeFoodPhoto
} from '../components/FoodComponents.jsx';
import { sumMacros, MEAL_ORDER } from '../utils/macros.js';
import { todayISO } from '../utils/date.js';

export default function Food() {
  const { profile } = useApp();
  const [params, setParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [foodOptions, setFoodOptions] = useState([]);
  const [flow, setFlow] = useState(null); // 'camera' | 'analyzing' | 'review'
  const [pendingFoods, setPendingFoods] = useState([]);
  const [targetMeal, setTargetMeal] = useState('breakfast');
  const [addModalMeal, setAddModalMeal] = useState(null);

  const loadLogs = useCallback(async () => {
    const today = todayISO();
    setLogs(await db.getAllByIndex('foodLogs', 'date', today));
  }, []);

  useEffect(() => {
    loadLogs();
    db.getAll('foods').then(setFoodOptions);
  }, [loadLogs]);

  useEffect(() => {
    const action = params.get('action');
    if (action === 'scan') {
      setFlow('camera');
      setParams({}, { replace: true });
    } else if (action === 'add') {
      setAddModalMeal('breakfast');
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const totals = sumMacros(logs);
  const targets = profile?.targets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  async function handleCapture(photoDataUrl) {
    setFlow('analyzing');
    try {
      const result = await analyzeFoodPhoto(photoDataUrl);
      setPendingFoods(result.foods);
      setFlow('review');
    } catch {
      setFlow(null);
    }
  }

  async function confirmLog(foods) {
    const today = todayISO();
    for (const f of foods) {
      await db.put('foodLogs', {
        name: f.name,
        serving: Number(f.serving) || 0,
        unit: f.unit || 'g',
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fat: Number(f.fat) || 0,
        fiber: Number(f.fiber) || 0,
        date: today,
        meal: targetMeal,
        loggedVia: f.confidence !== undefined ? 'ai_scan' : 'manual'
      });
    }
    setFlow(null);
    loadLogs();
  }

  async function deleteLog(id) {
    await db.delete('foodLogs', id);
    loadLogs();
  }

  async function addManualFood(food) {
    const today = todayISO();
    await db.put('foodLogs', {
      name: food.name,
      serving: Number(food.serving) || 0,
      unit: food.unit || 'g',
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
      fiber: Number(food.fiber) || 0,
      date: today,
      meal: addModalMeal,
      loggedVia: 'manual'
    });
    setAddModalMeal(null);
    loadLogs();
  }

  const logsByMeal = (meal) => logs.filter((l) => l.meal === meal);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-5 mf-stagger">
      <header className="flex items-center justify-between mf-interactive">
        <h1 className="font-display text-2xl font-semibold">Food</h1>
        <button
          onClick={() => {
            setTargetMeal('breakfast');
            setFlow('camera');
          }}
          className="text-xs font-semibold bg-navy dark:bg-volt text-volt dark:text-navy rounded-full px-4 py-2 mf-interactive" 
          >
          Scan Food
        </button>
      </header>

      <div className="mf-hover-lift">
  <MacroSummary totals={totals} targets={targets} />
</div>

      <div className="flex flex-col gap-3 mf-stagger">
        {MEAL_ORDER.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            items={logsByMeal(meal)}
            onAdd={(m) => setAddModalMeal(m)}
            onDelete={deleteLog}
          />
        ))}
      </div>

      {flow === 'camera' && (
        <CameraCapture
          onCancel={() => setFlow(null)}
          onCapture={(photo) => {
            handleCapture(photo);
          }}
        />
      )}
      {flow === 'analyzing' && <AnalyzingScreen />}
      {flow === 'review' && (
        <FoodResultReview
          initialFoods={pendingFoods}
          meal={targetMeal}
          onCancel={() => setFlow(null)}
          onScanAgain={() => setFlow('camera')}
          onConfirm={confirmLog}
        />
      )}
      {addModalMeal && (
        <AddFoodModal
          meal={addModalMeal}
          foodOptions={foodOptions}
          onClose={() => setAddModalMeal(null)}
          onAdd={addManualFood}
        />
      )}
    </div>
  );
}

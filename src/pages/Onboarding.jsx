import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { ACTIVITY_LEVELS, GOALS } from '../services/nutritionCalc.js';
import { EQUIPMENT_OPTIONS } from '../data/exerciseDatabase.js';

const GOAL_LABELS = {
  lose_fat: 'Lose fat',
  maintain: 'Maintain weight',
  gain_muscle: 'Gain muscle',
  gain_weight: 'Gain weight',
  recomposition: 'Recomposition',
  custom: 'Custom'
};
const ACTIVITY_LABELS = {
  sedentary: 'Sedentary — little/no exercise',
  light: 'Light — 1-3 days/week',
  moderate: 'Moderate — 3-5 days/week',
  active: 'Active — 6-7 days/week',
  very_active: 'Very active — physical job + training'
};

const STEPS = ['Personal', 'Goal', 'Experience', 'Workouts', 'Nutrition'];

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink/70 dark:text-paper/70">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'rounded-xl border border-edge-light dark:border-edge-dark bg-transparent px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-volt/60';

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
        active
          ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent'
          : 'border-edge-light dark:border-edge-dark text-ink/70 dark:text-paper/70'
      }`}
    >
      {children}
    </button>
  );
}

export default function Onboarding() {
  const { saveProfile, loadDemoData } = useApp();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sex: 'male',
    age: '',
    heightCm: '',
    weightKg: '',
    goalWeightKg: '',
    neckCm: '',
    waistCm: '',
    activityLevel: 'moderate',
    goal: 'maintain',
    experience: 'beginner',
    daysPerWeek: 3,
    durationMinutes: 45,
    equipment: ['bodyweight'],
    mealsPerDay: 3,
    dietaryRestrictions: '',
    foodsAvoided: '',
    allergies: '',
    units: 'metric'
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleEquipment = (eq) =>
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(eq) ? f.equipment.filter((x) => x !== eq) : [...f.equipment, eq]
    }));

  const canProceed = () => {
    if (step === 0) return form.age && form.heightCm && form.weightKg;
    return true;
  };

  async function finish() {
    setSaving(true);
    await saveProfile({
      ...form,
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      goalWeightKg: form.goalWeightKg ? Number(form.goalWeightKg) : Number(form.weightKg),
      neckCm: form.neckCm ? Number(form.neckCm) : undefined,
      waistCm: form.waistCm ? Number(form.waistCm) : undefined,
      daysPerWeek: Number(form.daysPerWeek),
      durationMinutes: Number(form.durationMinutes),
      mealsPerDay: Number(form.mealsPerDay),
      dietaryRestrictions: form.dietaryRestrictions ? form.dietaryRestrictions.split(',').map((s) => s.trim()) : [],
      foodsAvoided: form.foodsAvoided ? form.foodsAvoided.split(',').map((s) => s.trim()) : [],
      allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()) : [],
      onboardingComplete: true,
      targetsOverridden: false
    });
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex flex-col">
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col px-6 pt-10 pb-8">
        <div className="mb-8">
          <span className="font-display text-xl font-semibold">
            Macro<span className="text-navy dark:text-volt">Fit</span>
          </span>
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-navy dark:bg-volt' : 'bg-ink/10 dark:bg-paper/10'}`} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-xl font-semibold mb-1">Tell us about you</h1>
              <p className="text-sm text-ink/50 dark:text-paper/50 -mt-3">Used only to estimate your calorie and macro targets.</p>
              <Field label="Name">
                <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Optional" />
              </Field>
              <div className="flex gap-2">
                <Pill active={form.sex === 'male'} onClick={() => setForm((f) => ({ ...f, sex: 'male' }))}>Male</Pill>
                <Pill active={form.sex === 'female'} onClick={() => setForm((f) => ({ ...f, sex: 'female' }))}>Female</Pill>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Age">
                  <input type="number" className={inputCls} value={form.age} onChange={set('age')} />
                </Field>
                <Field label="Height (cm)">
                  <input type="number" className={inputCls} value={form.heightCm} onChange={set('heightCm')} />
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" className={inputCls} value={form.weightKg} onChange={set('weightKg')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Neck (cm) — optional">
                  <input type="number" className={inputCls} value={form.neckCm} onChange={set('neckCm')} />
                </Field>
                <Field label="Waist (cm) — optional">
                  <input type="number" className={inputCls} value={form.waistCm} onChange={set('waistCm')} />
                </Field>
              </div>
              <Field label="Activity level">
                <select className={inputCls} value={form.activityLevel} onChange={set('activityLevel')}>
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a} value={a}>
                      {ACTIVITY_LABELS[a]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-xl font-semibold mb-1">What's your goal?</h1>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((g) => (
                  <Pill key={g} active={form.goal === g} onClick={() => setForm((f) => ({ ...f, goal: g }))}>
                    {GOAL_LABELS[g]}
                  </Pill>
                ))}
              </div>
              <Field label="Goal weight (kg) — optional">
                <input type="number" className={inputCls} value={form.goalWeightKg} onChange={set('goalWeightKg')} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-xl font-semibold mb-1">Training experience</h1>
              <div className="flex flex-col gap-2.5">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                  <Pill key={lvl} active={form.experience === lvl} onClick={() => setForm((f) => ({ ...f, experience: lvl }))}>
                    {lvl[0].toUpperCase() + lvl.slice(1)}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-xl font-semibold mb-1">Workout preferences</h1>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Days per week">
                  <select className={inputCls} value={form.daysPerWeek} onChange={set('daysPerWeek')}>
                    {[2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>{d} days</option>
                    ))}
                  </select>
                </Field>
                <Field label="Session length (min)">
                  <select className={inputCls} value={form.durationMinutes} onChange={set('durationMinutes')}>
                    {[20, 30, 45, 60, 75, 90].map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Available equipment">
                <div className="flex flex-wrap gap-2 mt-1">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <Pill key={eq} active={form.equipment.includes(eq)} onClick={() => toggleEquipment(eq)}>
                      {eq}
                    </Pill>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-xl font-semibold mb-1">Nutrition preferences</h1>
              <Field label="Meals per day">
                <select className={inputCls} value={form.mealsPerDay} onChange={set('mealsPerDay')}>
                  {[2, 3, 4, 5, 6].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dietary restrictions (comma separated)">
                <input className={inputCls} value={form.dietaryRestrictions} onChange={set('dietaryRestrictions')} placeholder="e.g. vegetarian" />
              </Field>
              <Field label="Foods you avoid">
                <input className={inputCls} value={form.foodsAvoided} onChange={set('foodsAvoided')} placeholder="e.g. shellfish" />
              </Field>
              <Field label="Allergies — optional">
                <input className={inputCls} value={form.allergies} onChange={set('allergies')} placeholder="e.g. peanuts" />
              </Field>
              <Field label="Preferred units">
                <div className="flex gap-2">
                  <Pill active={form.units === 'metric'} onClick={() => setForm((f) => ({ ...f, units: 'metric' }))}>Metric (kg/cm)</Pill>
                  <Pill active={form.units === 'imperial'} onClick={() => setForm((f) => ({ ...f, units: 'imperial' }))}>Imperial (lb/ft-in)</Pill>
                </div>
              </Field>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="p-3 rounded-xl border border-edge-light dark:border-edge-dark">
              <ChevronLeft size={18} />
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-navy dark:bg-volt text-volt dark:text-navy font-semibold rounded-xl py-3 disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={finish}
              className="flex-1 bg-navy dark:bg-volt text-volt dark:text-navy font-semibold rounded-xl py-3 disabled:opacity-60"
            >
              {saving ? 'Setting up…' : 'Finish setup'}
            </button>
          )}
        </div>

        {step === 0 && (
          <button
            onClick={loadDemoData}
            className="text-xs text-center text-ink/40 dark:text-paper/40 mt-4 underline underline-offset-2"
          >
            Just exploring? Load demo data instead
          </button>
        )}
      </div>
    </div>
  );
}

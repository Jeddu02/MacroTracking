import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Plus, Scale, Ruler, Image as ImageIcon } from 'lucide-react';
import { db } from '../db/database.js';
import { useApp } from '../context/AppContext.jsx';
import {
  WeightLogForm,
  WeightChart,
  MeasurementForm,
  MeasurementHistory,
  ProgressPhotoCapture,
  ProgressPhotoCompare,
  BodyFatEstimator,
  WaterTracker,
  HabitTracker,
  SleepLogForm
} from '../components/ProgressComponents.jsx';
import { todayISO, daysAgoISO, formatShortDate } from '../utils/date.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const SECTIONS = ['Weight', 'Measurements', 'Photos', 'Body Fat', 'Nutrition', 'Habits'];

function NutritionAnalytics({ profile }) {
  const [range, setRange] = useState(7);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await db.getAll('foodLogs');
      const days = Array.from({ length: range }, (_, i) => daysAgoISO(range - 1 - i));
      const byDay = days.map((date) => {
        const logs = all.filter((l) => l.date === date);
        return {
          date,
          calories: logs.reduce((s, l) => s + (l.calories || 0), 0),
          protein: logs.reduce((s, l) => s + (l.protein || 0), 0)
        };
      });
      setRows(byDay);
    })();
  }, [range]);

  const targets = profile?.targets || { calories: 2000, protein: 150 };
  const avgCalories = rows.length ? Math.round(rows.reduce((s, r) => s + r.calories, 0) / rows.length) : 0;
  const avgProtein = rows.length ? Math.round(rows.reduce((s, r) => s + r.protein, 0) / rows.length) : 0;
  const proteinHitDays = rows.filter((r) => r.protein >= targets.protein * 0.9).length;

  const data = {
    labels: rows.map((r) => formatShortDate(r.date)),
    datasets: [{ data: rows.map((r) => r.calories), backgroundColor: '#C6F135', borderRadius: 4 }]
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[7, 30, 90].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${range === r ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}
          >
            {r}d
          </button>
        ))}
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-ink/40 dark:text-paper/40">Avg calories</p>
            <p className="font-display text-xl font-semibold">{avgCalories} kcal</p>
          </div>
          <div>
            <p className="text-xs text-ink/40 dark:text-paper/40">Avg protein</p>
            <p className="font-display text-xl font-semibold">{avgProtein} g</p>
          </div>
        </div>
        <div style={{ height: 140 }}>
          <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(128,128,128,0.12)' } } } }} />
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50 mt-3">
          Protein target hit {proteinHitDays}/{rows.length} days
          {avgProtein >= targets.protein * 0.9 ? ' — your average is close to your target this period.' : '.'}
        </p>
      </div>
    </div>
  );
}

export default function Progress() {
  const { profile } = useApp();
  const [params, setParams] = useSearchParams();
  const [section, setSection] = useState('Weight');
  const [weights, setWeights] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [water, setWater] = useState({ amountMl: 0, targetMl: 2500 });
  const [habitEntry, setHabitEntry] = useState(null);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showSleepForm, setShowSleepForm] = useState(false);

  const loadAll = useCallback(async () => {
    setWeights(await db.getAll('bodyWeights'));
    setMeasurements(await db.getAll('bodyMeasurements'));
    setPhotos(await db.getAll('progressPhotos'));
    const today = todayISO();
    const waterToday = await db.getAllByIndex('waterLogs', 'date', today);
    setWater(waterToday[0] || { date: today, amountMl: 0, targetMl: 2500 });
    const habitToday = await db.getAllByIndex('habitLogs', 'date', today);
    setHabitEntry(habitToday[0] || { date: today, habits: {} });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const action = params.get('action');
    if (action === 'weight') { setSection('Weight'); setShowWeightForm(true); setParams({}, { replace: true }); }
    if (action === 'water') { setSection('Habits'); setParams({}, { replace: true }); }
  }, [params, setParams]);

  async function saveWeight({ weightKg, note }) {
    await db.put('bodyWeights', { date: todayISO(), weightKg, note, time: new Date().toISOString() });
    setShowWeightForm(false);
    loadAll();
  }

  async function saveMeasurement(values) {
    await db.put('bodyMeasurements', { date: todayISO(), ...values });
    setShowMeasureForm(false);
    loadAll();
  }

  async function savePhoto({ angle, photo }) {
    await db.put('progressPhotos', { date: todayISO(), angle, photo });
    setShowPhotoForm(false);
    loadAll();
  }

  async function addWater(ml) {
    const saved = await db.put('waterLogs', { ...water, amountMl: (water.amountMl || 0) + ml });
    setWater(saved);
  }

  async function toggleHabit(key) {
    const saved = await db.put('habitLogs', { ...habitEntry, habits: { ...habitEntry.habits, [key]: !habitEntry.habits?.[key] } });
    setHabitEntry(saved);
  }

  async function saveSleep({ totalHours, quality }) {
    await db.put('sleepLogs', { date: todayISO(), totalHours, quality });
    setShowSleepForm(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-5 mf-stagger">
     <header className="mf-slide-down">
        <h1 className="font-display text-2xl font-semibold mb-3">Progress</h1>
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 mf-interactive">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 mf-interactive ${section === s ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark text-ink/60 dark:text-paper/60'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {section === 'Weight' && (
  <div className="flex flex-col gap-3 mf-stagger">
          <button onClick={() => setShowWeightForm(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold text-sm">
            <Scale size={16} /> Log Weight
          </button>
          <WeightChart entries={weights} goalWeightKg={profile?.goalWeightKg} />
        </div>
      )}

      {section === 'Measurements' && (
        <div className="flex flex-col gap-3 mf-stagger">
          <button onClick={() => setShowMeasureForm(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold text-sm mf-interactive mf-pop">
            <Ruler size={16} /> Log Measurements
          </button>
          <MeasurementHistory entries={measurements} />
        </div>
      )}

      {section === 'Photos' && (
        <div className="flex flex-col gap-3 mf-stagger">
          <button onClick={() => setShowPhotoForm(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold text-sm mf-interactive mf-pop">
            <ImageIcon size={16} /> Add Progress Photo
          </button>
          <ProgressPhotoCompare photos={photos} />
        </div>
      )}

      {section === 'Body Fat' && <BodyFatEstimator profile={profile} photos={photos} />}

      {section === 'Nutrition' && <NutritionAnalytics profile={profile} />}

      {section === 'Habits' && (
       <div className="flex flex-col gap-3 mf-stagger">
          <WaterTracker water={water} onAdd={addWater} />
          <HabitTracker habits={habitEntry?.habits} onToggle={toggleHabit} />
          <button onClick={() => setShowSleepForm(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-edge-light dark:border-edge-dark font-medium text-sm mf-interactive mf-pop">
            <Plus size={16} /> Log Sleep
          </button>
        </div>
      )}

      {showWeightForm && <WeightLogForm onSave={saveWeight} onClose={() => setShowWeightForm(false)} />}
      {showMeasureForm && <MeasurementForm onSave={saveMeasurement} onClose={() => setShowMeasureForm(false)} />}
      {showPhotoForm && <ProgressPhotoCapture onSave={savePhoto} onClose={() => setShowPhotoForm(false)} />}
      {showSleepForm && <SleepLogForm onSave={saveSleep} onClose={() => setShowSleepForm(false)} />}
    </div>
  );
}

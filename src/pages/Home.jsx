import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Dumbbell, Scale, ImagePlus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { db } from '../db/database.js';
import { MacroSummary } from '../components/MacroCard.jsx';
import { sumMacros } from '../utils/macros.js';
import { todayISO, daysAgoISO } from '../utils/date.js';

function QuickAction({ icon: Icon, label, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className={`card flex flex-col items-center justify-center gap-2 py-5 active:scale-[0.97] transition-transform ${
        accent ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : ''
      }`}
    >
      <Icon size={22} strokeWidth={2.2} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function Home() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [weightInfo, setWeightInfo] = useState(null);
  const [water, setWater] = useState(null);

  useEffect(() => {
    (async () => {
      const today = todayISO();
      const logs = await db.getAllByIndex('foodLogs', 'date', today);
      setTotals(sumMacros(logs));

      const workouts = await db.getAllByIndex('workouts', 'date', today);
      setTodayWorkout(workouts[0] || null);

      const weights = (await db.getAll('bodyWeights')).sort((a, b) => (a.date < b.date ? 1 : -1));
      if (weights.length) {
        const latest = weights[0];
        const weekAgo = weights.filter((w) => daysDiff(w.date, latest.date) <= 7);
        const avg = weekAgo.reduce((s, w) => s + w.weightKg, 0) / (weekAgo.length || 1);
        const change = weights.length > 1 ? latest.weightKg - weights[weights.length - 1].weightKg : 0;
        setWeightInfo({ current: latest.weightKg, weeklyAvg: avg, change });
      }

      const waterLogs = await db.getAllByIndex('waterLogs', 'date', today);
      setWater(waterLogs[0] || { amountMl: 0, targetMl: 2500 });
    })();
  }, []);

  function daysDiff(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  if (!profile) return null;
  const targets = profile.targets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/50 dark:text-paper/50">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="font-display text-2xl font-semibold">Hey, {profile.name || 'there'}</h1>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-ink/60 dark:text-paper/60 mb-2">Today's nutrition</h2>
        <MacroSummary totals={totals} targets={targets} />
      </section>

      <section className="grid grid-cols-4 gap-2">
        <QuickAction icon={Camera} label="Scan Food" accent onClick={() => navigate('/food?action=scan')} />
        <QuickAction icon={Plus} label="Add Food" onClick={() => navigate('/food?action=add')} />
        <QuickAction icon={Dumbbell} label="Workout" onClick={() => navigate('/workout')} />
        <QuickAction icon={Scale} label="Log Weight" onClick={() => navigate('/progress?action=weight')} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Today's workout</p>
          {todayWorkout ? (
            <>
              <p className="font-display font-semibold">{todayWorkout.dayLabel}</p>
              <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">
                {todayWorkout.completed ? 'Completed' : 'In progress'} · {todayWorkout.durationMinutes || '—'} min
              </p>
            </>
          ) : (
            <>
              <p className="font-display font-semibold">Rest day</p>
              <button onClick={() => navigate('/workout')} className="text-xs text-navy dark:text-volt font-medium mt-1">
                Start a session →
              </button>
            </>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Body weight</p>
          {weightInfo ? (
            <>
              <p className="font-display font-semibold">{weightInfo.current} kg</p>
              <p className="text-xs mt-1" style={{ color: weightInfo.change <= 0 ? '#4BBF8C' : '#FF6B6B' }}>
                {weightInfo.change > 0 ? '+' : ''}
                {weightInfo.change.toFixed(1)} kg overall · {weightInfo.weeklyAvg.toFixed(1)} kg 7-day avg
              </p>
            </>
          ) : (
            <button onClick={() => navigate('/progress?action=weight')} className="text-xs text-navy dark:text-volt font-medium">
              Log your first weigh-in →
            </button>
          )}
        </div>
      </section>

      {water && (
        <section className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Water</p>
            <p className="font-display font-semibold">
              {water.amountMl} / {water.targetMl} mL
            </p>
          </div>
          <button
            onClick={() => navigate('/progress?action=water')}
            className="p-2.5 rounded-full bg-volt/20 text-navy dark:text-volt"
          >
            <ImagePlus size={18} />
          </button>
        </section>
      )}
    </div>
  );
}

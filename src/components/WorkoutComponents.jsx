import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Play, Check, SkipForward, X, Trophy } from 'lucide-react';
import { EXERCISES, EQUIPMENT_OPTIONS, MUSCLE_GROUPS } from '../data/exerciseDatabase.js';
import { generateProgram, suggestProgression } from '../services/workoutGenerator.js';
import { useRestTimer } from '../context/TimerContext.jsx';
import { formatShortDate } from '../utils/date.js';

const inputCls = 'rounded-xl border border-edge-light dark:border-edge-dark bg-transparent px-3 py-2 text-sm';

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium border ${
        active ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Program drafter
// ---------------------------------------------------------------------------
export function ProgramDrafter({ profile, onGenerate }) {
  const [prefs, setPrefs] = useState({
    goal: profile?.goal || 'maintain',
    experience: profile?.experience || 'beginner',
    daysPerWeek: profile?.daysPerWeek || 3,
    durationMinutes: profile?.durationMinutes || 45,
    equipment: profile?.equipment?.length ? profile.equipment : ['bodyweight']
  });

  const toggleEq = (eq) =>
    setPrefs((p) => ({ ...p, equipment: p.equipment.includes(eq) ? p.equipment.filter((e) => e !== eq) : [...p.equipment, eq] }));

  return (
    <div className="card p-5 flex flex-col gap-4 mf-hover-lift">
      <h3 className="font-display font-semibold">Draft a program</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
          Days/week
          <select className={inputCls} value={prefs.daysPerWeek} onChange={(e) => setPrefs((p) => ({ ...p, daysPerWeek: Number(e.target.value) }))}>
            {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
          Duration
          <select className={inputCls} value={prefs.durationMinutes} onChange={(e) => setPrefs((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}>
            {[20, 30, 45, 60, 75, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_OPTIONS.map((eq) => (
          <Pill key={eq} active={prefs.equipment.includes(eq)} onClick={() => toggleEq(eq)}>{eq}</Pill>
        ))}
      </div>
      <button
        onClick={() => onGenerate(generateProgram(prefs))}
        className="py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold text-sm mf-interactive mf-pop"
      >
        Generate Program
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Program view / editor
// ---------------------------------------------------------------------------
function ExercisePicker({ muscle, onPick, onClose }) {
  const pool = EXERCISES.filter((e) => !muscle || e.primaryMuscle === muscle);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 max-h-[75vh] flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold text-sm">Choose exercise</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex flex-col gap-1">
          {pool.map((ex) => (
            <button key={ex.name} onClick={() => onPick(ex)} className="text-left px-3 py-2.5 rounded-lg hover:bg-ink/5 dark:hover:bg-paper/5">
              <p className="text-sm font-medium">{ex.name}</p>
              <p className="text-xs text-ink/40 dark:text-paper/40 capitalize">{ex.primaryMuscle} · {ex.equipment}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgramView({ program, onChange, onSave, onStartDay }) {
  const [pickerFor, setPickerFor] = useState(null); // { dayIndex }

  function updateDay(dayIndex, updater) {
    onChange({ ...program, days: program.days.map((d) => (d.dayIndex === dayIndex ? updater(d) : d)) });
  }

  function regenerateDay(dayIndex) {
    const day = program.days.find((d) => d.dayIndex === dayIndex);
    const fresh = generateProgram({ ...program, daysPerWeek: program.daysPerWeek }).days.find((d) => d.label === day.label);
    if (fresh) updateDay(dayIndex, () => ({ ...day, exercises: fresh.exercises }));
  }

  function removeExercise(dayIndex, idx) {
    updateDay(dayIndex, (d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== idx) }));
  }

  function updateExerciseField(dayIndex, idx, field, value) {
    updateDay(dayIndex, (d) => ({ ...d, exercises: d.exercises.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)) }));
  }

  function replaceExercise(dayIndex, idx, newEx) {
    updateDay(dayIndex, (d) => ({
      ...d,
      exercises: d.exercises.map((ex, i) => (i === idx ? { ...ex, name: newEx.name, primaryMuscle: newEx.primaryMuscle, equipment: newEx.equipment } : ex))
    }));
    setPickerFor(null);
  }

  function addExercise(dayIndex, newEx) {
    updateDay(dayIndex, (d) => ({
      ...d,
      exercises: [...d.exercises, { name: newEx.name, primaryMuscle: newEx.primaryMuscle, equipment: newEx.equipment, sets: 3, reps: '8-12' }]
    }));
    setPickerFor(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">{program.name}</h3>
        <button onClick={onSave} className="text-xs font-semibold bg-navy dark:bg-volt text-volt dark:text-navy rounded-full px-4 py-2">
          Save Program
        </button>
      </div>
      {program.days.map((day) => (
        <div key={day.dayIndex} className="card p-4 flex flex-col gap-3 mf-hover-lift">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Day {day.dayIndex} — {day.label}</h4>
            <div className="flex gap-1.5">
              <button onClick={() => regenerateDay(day.dayIndex)} className="p-1.5 rounded-full bg-ink/5 dark:bg-paper/5">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => onStartDay(day)} className="p-1.5 rounded-full bg-volt/20 text-navy dark:text-volt">
                <Play size={14} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 mf-stagger">
            {day.exercises.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <button onClick={() => setPickerFor({ dayIndex: day.dayIndex, idx, mode: 'replace' })} className="flex-1 text-left font-medium truncate">
                  {ex.name}
                </button>
                <input
                  className="w-10 text-center rounded-md border border-edge-light dark:border-edge-dark bg-transparent text-xs py-1"
                  value={ex.sets}
                  onChange={(e) => updateExerciseField(day.dayIndex, idx, 'sets', Number(e.target.value) || 1)}
                />
                <span className="text-xs text-ink/30 dark:text-paper/30">×</span>
                <input
                  className="w-14 text-center rounded-md border border-edge-light dark:border-edge-dark bg-transparent text-xs py-1"
                  value={ex.reps}
                  onChange={(e) => updateExerciseField(day.dayIndex, idx, 'reps', e.target.value)}
                />
                <button onClick={() => removeExercise(day.dayIndex, idx)} className="text-ink/25 dark:text-paper/25">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPickerFor({ dayIndex: day.dayIndex, mode: 'add' })}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-edge-light dark:border-edge-dark text-xs mf-interactive"
          >
            <Plus size={13} /> Add Exercise
          </button>
        </div>
      ))}
      {pickerFor && (
        <ExercisePicker
          onClose={() => setPickerFor(null)}
          onPick={(ex) =>
            pickerFor.mode === 'replace' ? replaceExercise(pickerFor.dayIndex, pickerFor.idx, ex) : addExercise(pickerFor.dayIndex, ex)
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rest timer panel (uses shared TimerContext so it survives navigation)
// ---------------------------------------------------------------------------
const PRESETS = [30, 60, 90, 120, 180];

export function RestTimerPanel({ exerciseName }) {
  const timer = useRestTimer();
  const [custom, setCustom] = useState('');
  const mins = Math.floor(timer.remaining / 60);
  const secs = timer.remaining % 60;

  return (
    <div className="card p-4 flex flex-col gap-3 mf-hover-lift">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Rest timer</h4>
        {timer.remaining > 0 && (
          <span className="font-display text-xl tabular-nums text-navy dark:text-volt">{mins}:{String(secs).padStart(2, '0')}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => timer.start(p, exerciseName)} className="rounded-full px-3 py-1.5 text-xs font-medium border border-edge-light dark:border-edge-dark mf-interactive">
            {p}s
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Custom"
            className="w-16 rounded-full px-3 py-1.5 text-xs border border-edge-light dark:border-edge-dark bg-transparent"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            onClick={() => custom && timer.start(Number(custom), exerciseName)}
            className="rounded-full px-3 py-1.5 text-xs font-medium bg-ink/5 dark:bg-paper/5 mf-interactive"
          >
            Go
          </button>
        </div>
      </div>
      {timer.remaining > 0 && (
        <div className="flex gap-2">
          <button onClick={() => (timer.running ? timer.pause() : timer.resume())} className="flex-1 py-2 rounded-lg bg-ink/5 dark:bg-paper/5 text-xs font-medium">
            {timer.running ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => timer.addSeconds(15)} className="flex-1 py-2 rounded-lg bg-ink/5 dark:bg-paper/5 text-xs font-medium">+15s</button>
          <button onClick={() => timer.reset()} className="flex-1 py-2 rounded-lg bg-ink/5 dark:bg-paper/5 text-xs font-medium">Stop</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active workout session
// ---------------------------------------------------------------------------
export function ExerciseSession({ exercise, lastPerformance, onComplete, onSkip }) {
  const [sets, setSets] = useState(
    Array.from({ length: exercise.sets || 3 }, () => ({ weight: '', reps: '', rpe: '' }))
  );
  const timer = useRestTimer();
  const suggestion = suggestProgression(lastPerformance, exercise.goal);

  function updateSet(i, field, value) {
    setSets((s) => s.map((set, idx) => (idx === i ? { ...set, [field]: value } : set)));
  }
  function addSet() {
    setSets((s) => [...s, { weight: '', reps: '', rpe: '' }]);
  }

  return (
    <div className="card p-4 flex flex-col gap-3 mf-hover-lift mf-page">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display font-semibold">{exercise.name}</h4>
          <p className="text-xs text-ink/40 dark:text-paper/40">Target: {exercise.sets}×{exercise.reps}</p>
        </div>
        <button onClick={() => onSkip(exercise)} className="text-xs text-ink/40 dark:text-paper/40 flex items-center gap-1">
          <SkipForward size={13} /> Skip
        </button>
      </div>

      {suggestion && (
        <div className="text-xs bg-volt/10 text-navy dark:text-volt rounded-lg px-3 py-2">
          Last time: {lastPerformance.map((s) => `${s.weight}×${s.reps}`).join(', ')}. Try {suggestion.weight}kg × {suggestion.reps}. {suggestion.note}
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center text-xs text-ink/40 dark:text-paper/40">
        <span />
        <span>Weight (kg)</span>
        <span>Reps</span>
        <span>RPE</span>
      </div>
      {sets.map((set, i) => (
       <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center mf-interactive">
          <span className="text-xs w-5 text-ink/40 dark:text-paper/40">{i + 1}</span>
          <input className={inputCls} type="number" value={set.weight} onChange={(e) => updateSet(i, 'weight', e.target.value)} />
          <input className={inputCls} type="number" value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} />
          <input className={inputCls} type="number" value={set.rpe} onChange={(e) => updateSet(i, 'rpe', e.target.value)} placeholder="—" />
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={addSet} className="flex-1 py-2 rounded-lg border border-dashed border-edge-light dark:border-edge-dark text-xs flex items-center justify-center gap-1">
          <Plus size={13} /> Add Set
        </button>
        <button onClick={() => timer.start(90, exercise.name)} className="flex-1 py-2 rounded-lg bg-ink/5 dark:bg-paper/5 text-xs font-medium">
          Start Rest
        </button>
      </div>
      <button
        onClick={() =>
          onComplete(
            exercise,
            sets.filter((s) => s.weight !== '' && s.reps !== '').map((s) => ({ weight: Number(s.weight), reps: Number(s.reps), rpe: s.rpe ? Number(s.rpe) : null }))
          )
        }
        className="py-2.5 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold text-sm flex items-center justify-center gap-2 mf-interactive mf-pop"
      >
        <Check size={16} /> Complete Exercise
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History + PRs
// ---------------------------------------------------------------------------
export function WorkoutHistoryList({ workouts, onOpen }) {
  if (!workouts.length) return <p className="text-sm text-ink/40 dark:text-paper/40">No workouts logged yet.</p>;
  return (
    <div className="flex flex-col gap-2">
      {workouts.map((w) => {
        const totalSets = w.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0;
        const volume = w.exercises?.reduce((a, e) => a + e.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0) || 0;
        return (
          <button key={w.id} onClick={() => onOpen(w)} className="card p-4 text-left flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{w.dayLabel}</p>
              <p className="text-xs text-ink/40 dark:text-paper/40">{formatShortDate(w.date)} · {totalSets} sets · {Math.round(volume)}kg volume</p>
            </div>
            <span className="text-xs text-ink/30 dark:text-paper/30">{w.durationMinutes || '—'} min</span>
          </button>
        );
      })}
    </div>
  );
}

export function PRList({ records }) {
  if (!records.length) return <p className="text-sm text-ink/40 dark:text-paper/40">No personal records yet — they'll show up as you log workouts.</p>;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {records.map((r) => (
        <div key={r.id} className="card p-3.5">
          <div className="flex items-center gap-1.5 text-volt mb-1">
            <Trophy size={13} />
            <span className="text-[11px] font-medium text-ink/40 dark:text-paper/40">{formatShortDate(r.date)}</span>
          </div>
          <p className="text-sm font-medium truncate">{r.exerciseName}</p>
          <p className="text-xs text-ink/50 dark:text-paper/50">{r.weight}kg × {r.reps} · ~{r.estimated1RM}kg 1RM</p>
        </div>
      ))}
    </div>
  );
}

export { MUSCLE_GROUPS };

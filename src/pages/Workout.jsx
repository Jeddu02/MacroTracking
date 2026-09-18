import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { db } from '../db/database.js';
import { useApp } from '../context/AppContext.jsx';
import {
  ProgramDrafter,
  ProgramView,
  ExerciseSession,
  RestTimerPanel,
  WorkoutHistoryList,
  PRList
} from '../components/WorkoutComponents.jsx';
import { todayISO } from '../utils/date.js';

const TABS = ['Program', 'History', 'Records'];

function estimate1RM(weight, reps) {
  return Math.round(weight * (1 + reps / 30));
}

export default function Workout() {
  const { profile } = useApp();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('Program');
  const [program, setProgram] = useState(null);
  const [session, setSession] = useState(null); // { day, exerciseIndex, log: [] }
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [records, setRecords] = useState([]);
  const [lastPerformanceByExercise, setLastPerformanceByExercise] = useState({});
  const [openWorkout, setOpenWorkout] = useState(null);

  const loadAll = useCallback(async () => {
    const programs = await db.getAll('workoutPrograms');
    setProgram(programs[programs.length - 1] || null);
    const workouts = (await db.getAll('workouts')).sort((a, b) => (a.date < b.date ? 1 : -1));
    setPastWorkouts(workouts);
    setRecords((await db.getAll('personalRecords')).sort((a, b) => (a.date < b.date ? 1 : -1)));

    const perf = {};
    for (const w of workouts) {
      for (const ex of w.exercises || []) {
        if (!perf[ex.name]) perf[ex.name] = ex.sets;
      }
    }
    setLastPerformanceByExercise(perf);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (params.get('action') === 'start' && program?.days?.length) {
      setSession({ day: program.days[0], exerciseIndex: 0, log: [], startedAt: Date.now() });
      setParams({}, { replace: true });
    }
  }, [params, program, setParams]);

  async function saveProgram(prog) {
    const saved = await db.put('workoutPrograms', prog);
    setProgram(saved);
  }

  function startDay(day) {
    setSession({ day, exerciseIndex: 0, log: [], startedAt: Date.now() });
  }

  async function completeExercise(exercise, sets) {
    const nextLog = [...session.log, { name: exercise.name, sets }];
    if (sets.length) {
      const best = sets.reduce((a, b) => (a.weight * a.reps > b.weight * b.reps ? a : b));
      const existing = records.find((r) => r.exerciseName === exercise.name);
      const newEst = estimate1RM(best.weight, best.reps);
      if (!existing || newEst > existing.estimated1RM) {
        const saved = await db.put('personalRecords', {
          exerciseName: exercise.name,
          weight: best.weight,
          reps: best.reps,
          estimated1RM: newEst,
          date: todayISO()
        });
        setRecords((r) => [saved, ...r.filter((x) => x.exerciseName !== exercise.name)]);
      }
    }
    advanceOrFinish(nextLog);
  }

  function skipExercise(exercise) {
    advanceOrFinish(session.log);
  }

  async function advanceOrFinish(nextLog) {
    const isLast = session.exerciseIndex >= session.day.exercises.length - 1;
    if (isLast) {
      const durationMinutes = Math.round((Date.now() - session.startedAt) / 60000);
      await db.put('workouts', {
        date: todayISO(),
        programId: program?.id,
        dayLabel: session.day.label,
        durationMinutes,
        completed: true,
        exercises: nextLog
      });
      setSession(null);
      loadAll();
    } else {
      setSession((s) => ({ ...s, exerciseIndex: s.exerciseIndex + 1, log: nextLog }));
    }
  }

  if (session) {
    const currentExercise = session.day.exercises[session.exerciseIndex];
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-4 mf-stagger">
        <header className="flex items-center justify-between mf-slide-down">
          <div>
            <p className="text-xs text-ink/40 dark:text-paper/40">
              Exercise {session.exerciseIndex + 1} of {session.day.exercises.length}
            </p>
            <h1 className="font-display text-xl font-semibold">{session.day.label}</h1>
          </div>
          <button onClick={() => setSession(null)} className="p-2 rounded-full bg-ink/5 dark:bg-paper/5">
            <X size={18} />
          </button>
        </header>
        <ExerciseSession
          exercise={currentExercise}
          lastPerformance={lastPerformanceByExercise[currentExercise.name]}
          onComplete={completeExercise}
          onSkip={skipExercise}
        />
        <RestTimerPanel exerciseName={currentExercise.name} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-5 mf-stagger">
      <header className="mf-slide-down">
        <h1 className="font-display text-2xl font-semibold mb-3">Workout</h1>
       <div className="flex gap-1 bg-ink/5 dark:bg-paper/5 rounded-full p-1 w-fit mf-interactive">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 mf-interactive ${tab === t ? 'bg-surface-light dark:bg-surface-dark shadow-sm' : 'text-ink/50 dark:text-paper/50'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === 'Program' &&
        (program ? (
          <ProgramView program={program} onChange={setProgram} onSave={() => saveProgram(program)} onStartDay={startDay} />
        ) : (
          <ProgramDrafter profile={profile} onGenerate={setProgram} />
        ))}
      {tab === 'Program' && program && (
        <button onClick={() => setProgram(null)} className="text-xs text-ink/40 dark:text-paper/40 underline underline-offset-2 self-start">
          Draft a different program
        </button>
      )}

      {tab === 'History' && (
        <WorkoutHistoryList workouts={pastWorkouts} onOpen={setOpenWorkout} />
      )}

      {tab === 'Records' && <PRList records={records} />}

      {openWorkout && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center" onClick={() => setOpenWorkout(null)}>
          <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-semibold">{openWorkout.dayLabel}</h3>
              <button onClick={() => setOpenWorkout(null)}><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {openWorkout.exercises.map((ex, i) => (
                <div key={i}>
                  <p className="text-sm font-medium mb-1">{ex.name}</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {ex.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Check, X, Plus, Trash2, Upload, ChevronRight } from 'lucide-react';
import { analyzeFoodPhoto } from '../services/foodAnalysisService.js';
import { MEAL_LABELS } from '../utils/macros.js';

// ---------------------------------------------------------------------------
// Camera capture
// ---------------------------------------------------------------------------
export function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('environment');
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setError('permission');
      }
    }
    if (!photo) start();
    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, photo]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85));
    stopStream();
  }

  function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  if (error === 'permission') {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
        <p className="max-w-xs text-sm opacity-80">
          Camera access was denied or isn't available. You can still upload a photo instead.
        </p>
        <label className="bg-volt text-navy font-semibold rounded-xl px-5 py-3 cursor-pointer flex items-center gap-2">
          <Upload size={16} /> Upload Photo Instead
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
        <button onClick={onCancel} className="text-sm opacity-60 mt-2">Cancel</button>
        {photo && <ConfirmPhoto photo={photo} onRetake={() => setPhoto(null)} onConfirm={() => onCapture(photo)} />}
      </div>
    );
  }

  if (photo) return <ConfirmPhoto photo={photo} onRetake={() => setPhoto(null)} onConfirm={() => onCapture(photo)} />;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4">
        <button onClick={onCancel} className="p-2.5 rounded-full bg-black/50 text-white">
          <X size={20} />
        </button>
        <button onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} className="p-2.5 rounded-full bg-black/50 text-white">
          <RotateCcw size={20} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 pb-10 pt-6 bg-gradient-to-t from-black/70 to-transparent">
        <label className="p-3 rounded-full bg-white/20 text-white cursor-pointer">
          <Upload size={20} />
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
        <button onClick={capture} className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-95 transition-transform" />
        <div className="w-11" />
      </div>
    </div>
  );
}

function ConfirmPhoto({ photo, onRetake, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <img src={photo} alt="Captured food" className="flex-1 w-full h-full object-cover" />
      <div className="flex gap-3 p-5 bg-black">
        <button onClick={onRetake} className="flex-1 py-3 rounded-xl border border-white/30 text-white font-medium">
          Retake
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-volt text-navy font-semibold">
          Use Photo
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analyzing + editable AI result confirmation (spec §7-8: never auto-saved)
// ---------------------------------------------------------------------------
export function AnalyzingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-navy flex flex-col items-center justify-center gap-4 text-paper">
      <div className="w-12 h-12 rounded-full border-4 border-volt/30 border-t-volt animate-spin" />
      <p className="font-display text-lg">Analyzing food…</p>
      <p className="text-xs opacity-60 max-w-xs text-center">
        Identifying items and estimating portions. You'll be able to review and edit everything before it's logged.
      </p>
    </div>
  );
}

function editableFoodRow(food, i, onChange, onRemove) {
  const num = (key) => (e) => onChange(i, { ...food, [key]: e.target.value === '' ? '' : Number(e.target.value) });
  return (
    <div key={i} className="card p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <input
          className="font-semibold text-sm bg-transparent flex-1 focus:outline-none"
          value={food.name}
          onChange={(e) => onChange(i, { ...food, name: e.target.value })}
        />
        <button onClick={() => onRemove(i)} className="text-ink/30 dark:text-paper/30">
          <Trash2 size={16} />
        </button>
      </div>
      {typeof food.confidence === 'number' && (
        <span className="text-[11px] text-ink/40 dark:text-paper/40 -mt-1.5">
          Estimated · {Math.round(food.confidence * 100)}% confidence
        </span>
      )}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Serving</span>
          <div className="flex">
            <input type="number" className="w-full rounded-l-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.serving} onChange={num('serving')} />
            <span className="rounded-r-lg border border-l-0 border-edge-light dark:border-edge-dark px-2 py-1.5 text-ink/40 dark:text-paper/40">{food.unit}</span>
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Calories</span>
          <input type="number" className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.calories} onChange={num('calories')} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Protein</span>
          <input type="number" className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.protein} onChange={num('protein')} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Carbs</span>
          <input type="number" className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.carbs} onChange={num('carbs')} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Fat</span>
          <input type="number" className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.fat} onChange={num('fat')} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-ink/40 dark:text-paper/40">Fiber</span>
          <input type="number" className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-2 py-1.5" value={food.fiber || 0} onChange={num('fiber')} />
        </label>
      </div>
    </div>
  );
}

export function FoodResultReview({ initialFoods, meal, onConfirm, onCancel, onScanAgain }) {
  const [foods, setFoods] = useState(initialFoods);

  function updateFood(i, next) {
    setFoods((f) => f.map((x, idx) => (idx === i ? next : x)));
  }
  function removeFood(i) {
    setFoods((f) => f.filter((_, idx) => idx !== i));
  }
  function addBlank() {
    setFoods((f) => [...f, { name: 'New item', serving: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }]);
  }

  const total = foods.reduce(
    (a, f) => ({
      calories: a.calories + Number(f.calories || 0),
      protein: a.protein + Number(f.protein || 0),
      carbs: a.carbs + Number(f.carbs || 0),
      fat: a.fat + Number(f.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="fixed inset-0 z-50 bg-paper dark:bg-ink flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-edge-light dark:border-edge-dark">
        <button onClick={onCancel} className="text-sm text-ink/50 dark:text-paper/50">Cancel</button>
        <span className="font-display font-semibold">Review & confirm</span>
        <span className="w-12" />
      </header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <p className="text-xs text-ink/50 dark:text-paper/50 -mt-1">
          Logging to <strong>{MEAL_LABELS[meal]}</strong>. Nothing is saved until you confirm — edit anything that looks off.
        </p>
        {foods.map((f, i) => editableFoodRow(f, i, updateFood, removeFood))}
        <button onClick={addBlank} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-edge-light dark:border-edge-dark text-sm text-ink/60 dark:text-paper/60">
          <Plus size={16} /> Add Food
        </button>
      </div>
      <footer className="p-4 border-t border-edge-light dark:border-edge-dark flex flex-col gap-3">
        <div className="flex justify-between text-sm font-medium">
          <span>Total</span>
          <span className="tabular-nums">
            {Math.round(total.calories)} kcal · {Math.round(total.protein)}P · {Math.round(total.carbs)}C · {Math.round(total.fat)}F
          </span>
        </div>
        <div className="flex gap-3">
          {onScanAgain && (
            <button onClick={onScanAgain} className="flex-1 py-3 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium">
              Scan Again
            </button>
          )}
          <button
            onClick={() => onConfirm(foods)}
            className="flex-[2] py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold flex items-center justify-center gap-2"
          >
            <Check size={18} /> Confirm & Log
          </button>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meal log section
// ---------------------------------------------------------------------------
export function MealSection({ meal, items, onAdd, onDelete }) {
  const total = items.reduce((a, f) => a + (f.calories || 0), 0);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-sm">{MEAL_LABELS[meal]}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40 dark:text-paper/40">{Math.round(total)} kcal</span>
          <button onClick={() => onAdd(meal)} className="p-1.5 rounded-full bg-volt/20 text-navy dark:text-volt">
            <Plus size={14} />
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink/30 dark:text-paper/30 py-2">Nothing logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 border-edge-light/60 dark:border-edge-dark/60">
              <div>
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-ink/40 dark:text-paper/40">
                  {Math.round(it.serving)}{it.unit} · {Math.round(it.calories)} kcal · {Math.round(it.protein)}P/{Math.round(it.carbs)}C/{Math.round(it.fat)}F
                </p>
              </div>
              <button onClick={() => onDelete(it.id)} className="text-ink/25 dark:text-paper/25">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual add-food modal (search saved DB + custom entry)
// ---------------------------------------------------------------------------
export function AddFoodModal({ meal, foodOptions, onClose, onAdd }) {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(null);

  const filtered = query.length
    ? foodOptions.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : foodOptions.slice(0, 20);

  if (custom) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
        <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
          <h3 className="font-display font-semibold">Custom food</h3>
          {['name', 'serving', 'unit', 'calories', 'protein', 'carbs', 'fat', 'fiber'].map((key) => (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-ink/50 dark:text-paper/50 capitalize">{key}</span>
              <input
                className="rounded-lg border border-edge-light dark:border-edge-dark bg-transparent px-3 py-2"
                value={custom[key] ?? ''}
                onChange={(e) => setCustom({ ...custom, [key]: e.target.value })}
              />
            </label>
          ))}
          <div className="flex gap-3 mt-2">
            <button onClick={() => setCustom(null)} className="flex-1 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark">Back</button>
            <button
              onClick={() =>
                onAdd({
                  ...custom,
                  serving: Number(custom.serving) || 100,
                  calories: Number(custom.calories) || 0,
                  protein: Number(custom.protein) || 0,
                  carbs: Number(custom.carbs) || 0,
                  fat: Number(custom.fat) || 0,
                  fiber: Number(custom.fiber) || 0,
                  source: 'custom'
                })
              }
              className="flex-1 py-2.5 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold"
            >
              Add to {MEAL_LABELS[meal]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 flex flex-col gap-3 max-h-[85vh]">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Add to {MEAL_LABELS[meal]}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <input
          autoFocus
          placeholder="Search foods…"
          className="rounded-xl border border-edge-light dark:border-edge-dark bg-transparent px-3.5 py-2.5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
          {filtered.map((f, i) => (
            <button
              key={i}
              onClick={() => onAdd({ ...f, source: f.source || 'saved' })}
              className="flex items-center justify-between text-left px-3 py-2.5 rounded-lg hover:bg-ink/5 dark:hover:bg-paper/5"
            >
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-ink/40 dark:text-paper/40">
                  {f.serving}{f.unit} · {f.calories} kcal
                </p>
              </div>
              <ChevronRight size={16} className="text-ink/20 dark:text-paper/20" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setCustom({ name: query || '', serving: 100, unit: 'g', calories: '', protein: '', carbs: '', fat: '', fiber: '' })}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-edge-light dark:border-edge-dark text-sm"
        >
          <Plus size={15} /> Create custom food
        </button>
      </div>
    </div>
  );
}

export { analyzeFoodPhoto, Camera };

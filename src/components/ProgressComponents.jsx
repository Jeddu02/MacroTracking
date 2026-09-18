import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Camera, Plus, X, Droplets, Moon } from 'lucide-react';
import { calcNavyBodyFat } from '../services/nutritionCalc.js';
import { estimateBodyComposition } from '../services/bodyCompositionService.js';
import { formatShortDate } from '../utils/date.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const inputCls = 'rounded-xl border border-edge-light dark:border-edge-dark bg-transparent px-3 py-2 text-sm';

function lineOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} ${unit}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
      y: { grid: { color: 'rgba(128,128,128,0.12)' } }
    }
  };
}

// ---------------------------------------------------------------------------
// Weight tracker
// ---------------------------------------------------------------------------
export function WeightLogForm({ onSave, onClose }) {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold">Log weight</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <input autoFocus type="number" placeholder="Weight (kg)" className={inputCls} value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input placeholder="Note (optional)" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          disabled={!weight}
          onClick={() => onSave({ weightKg: Number(weight), note })}
          className="py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function WeightChart({ entries, goalWeightKg }) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const data = {
    labels: sorted.map((e) => formatShortDate(e.date)),
    datasets: [
      { data: sorted.map((e) => e.weightKg), borderColor: '#C6F135', backgroundColor: 'rgba(198,241,53,0.12)', fill: true, tension: 0.3, pointRadius: 2 }
    ]
  };
  if (sorted.length === 0) return <p className="text-sm text-ink/40 dark:text-paper/40">No weigh-ins yet.</p>;
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  return (
    <div className="card p-4">
      <div className="flex justify-between items-baseline mb-3">
        <div>
          <p className="text-2xl font-display font-semibold">{latest.weightKg} kg</p>
          <p className="text-xs text-ink/40 dark:text-paper/40">
            {(latest.weightKg - first.weightKg).toFixed(1)} kg since {formatShortDate(first.date)}
            {goalWeightKg ? ` · goal ${goalWeightKg} kg` : ''}
          </p>
        </div>
      </div>
      <div style={{ height: 160 }}>
        <Line data={data} options={lineOptions('kg')} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Body measurements
// ---------------------------------------------------------------------------
const MEASUREMENT_FIELDS = [
  ['waistCm', 'Waist'],
  ['neckCm', 'Neck'],
  ['chestCm', 'Chest'],
  ['armsCm', 'Arms'],
  ['thighsCm', 'Thighs'],
  ['hipsCm', 'Hips'],
  ['calvesCm', 'Calves']
];

export function MeasurementForm({ onSave, onClose }) {
  const [values, setValues] = useState({});
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold">Log measurements</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_FIELDS.map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
              {label} (cm)
              <input type="number" className={inputCls} value={values[key] || ''} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
            </label>
          ))}
        </div>
        <button
          onClick={() => onSave(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v) || undefined])))}
          className="py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function MeasurementHistory({ entries }) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!sorted.length) return <p className="text-sm text-ink/40 dark:text-paper/40">No measurements logged yet.</p>;
  const latest = sorted[0];
  return (
    <div className="card p-4">
      <p className="text-xs text-ink/40 dark:text-paper/40 mb-3">Latest — {formatShortDate(latest.date)}</p>
      <div className="grid grid-cols-3 gap-3">
        {MEASUREMENT_FIELDS.filter(([key]) => latest[key]).map(([key, label]) => (
          <div key={key}>
            <p className="text-xs text-ink/40 dark:text-paper/40">{label}</p>
            <p className="font-display font-semibold">{latest[key]} cm</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress photos
// ---------------------------------------------------------------------------
export function ProgressPhotoCapture({ onSave, onClose }) {
  const [angle, setAngle] = useState('front');
  const [photo, setPhoto] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold">Progress photo</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          Good lighting, full body visible, minimal loose clothing, same distance each time — this makes comparisons meaningful.
        </p>
        <div className="flex gap-2">
          {['front', 'side', 'back'].map((a) => (
            <button
              key={a}
              onClick={() => setAngle(a)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize ${angle === a ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}
            >
              {a}
            </button>
          ))}
        </div>
        {photo ? (
          <img src={photo} alt="Progress" className="rounded-xl w-full aspect-[3/4] object-cover" />
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-edge-light dark:border-edge-dark rounded-xl py-10 cursor-pointer text-ink/40 dark:text-paper/40">
            <Camera size={22} />
            <span className="text-xs">Take or upload a photo</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>
        )}
        <p className="text-[11px] text-ink/40 dark:text-paper/40">Stored on this device only, unless you choose to use AI body-composition analysis.</p>
        <button
          disabled={!photo}
          onClick={() => onSave({ angle, photo })}
          className="py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold disabled:opacity-40"
        >
          Save Photo
        </button>
      </div>
    </div>
  );
}

export function ProgressPhotoCompare({ photos }) {
  const [angle, setAngle] = useState('front');
  const [slider, setSlider] = useState(50);
  const filtered = photos.filter((p) => p.angle === angle).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!photos.length) return <p className="text-sm text-ink/40 dark:text-paper/40">No progress photos yet.</p>;

  const first = filtered[0];
  const latest = filtered[filtered.length - 1];

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        {['front', 'side', 'back'].map((a) => (
          <button
            key={a}
            onClick={() => setAngle(a)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium border capitalize ${angle === a ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}
          >
            {a}
          </button>
        ))}
      </div>
      {filtered.length < 2 ? (
        <p className="text-xs text-ink/40 dark:text-paper/40">Add a second {angle} photo to compare over time.</p>
      ) : (
        <>
          <div className="relative rounded-xl overflow-hidden aspect-[3/4]">
            <img src={latest.photo} alt="Latest" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
              <img src={first.photo} alt="Earlier" className="w-full h-full object-cover" style={{ width: `${(100 / slider) * 100}%`, maxWidth: 'none' }} />
            </div>
            <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-white rounded px-1.5 py-0.5">{formatShortDate(first.date)}</div>
            <div className="absolute top-2 right-2 text-[10px] bg-black/50 text-white rounded px-1.5 py-0.5">{formatShortDate(latest.date)}</div>
          </div>
          <input type="range" min="0" max="100" value={slider} onChange={(e) => setSlider(Number(e.target.value))} className="w-full accent-volt" />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Body-fat estimator
// ---------------------------------------------------------------------------
export function BodyFatEstimator({ profile, photos }) {
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const navyEstimate = calcNavyBodyFat({
    sex: profile?.sex,
    heightCm: profile?.heightCm,
    waistCm: profile?.waistCm,
    neckCm: profile?.neckCm,
    hipCm: profile?.hipCm
  });

  async function runPhotoEstimate() {
    setConfirmed(false);
    // In this demo, no photo ever leaves the device — this confirmation step is
    // where a real integration would ask before uploading to an external API.
    setLoading(true);
    const recentPhotos = photos.filter((p) => ['front', 'side'].includes(p.angle)).slice(-2);
    const result = await estimateBodyComposition({ photos: recentPhotos, navyEstimate });
    setAiResult(result);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="card p-4">
        <p className="text-xs text-ink/40 dark:text-paper/40 mb-1">Measurement-based estimate</p>
        {navyEstimate ? (
          <p className="font-display text-2xl font-semibold">{navyEstimate}%</p>
        ) : (
          <p className="text-sm text-ink/40 dark:text-paper/40">Add waist and neck measurements in your profile to see this.</p>
        )}
        <p className="text-[11px] text-ink/40 dark:text-paper/40 mt-1">U.S. Navy method — a formula, not a scan. Treat it as directional.</p>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-ink/40 dark:text-paper/40 mb-1">Visual body composition estimate</p>
          <p className="text-[11px] text-ink/40 dark:text-paper/40">Experimental. AI-generated estimate from your progress photos — actual body fat may differ substantially.</p>
        </div>
        {!aiResult && !loading && !confirmed && (
          <button
            onClick={() => setConfirmed('ask')}
            disabled={photos.length === 0}
            className="py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium disabled:opacity-40"
          >
            {photos.length === 0 ? 'Add a progress photo first' : 'Run visual estimate'}
          </button>
        )}
        {confirmed === 'ask' && (
          <div className="rounded-xl bg-ink/5 dark:bg-paper/5 p-3 flex flex-col gap-2">
            <p className="text-xs">This analysis runs on your device photos. If a real AI service is connected, they'll be sent to it — continue?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmed(false)} className="flex-1 py-2 rounded-lg text-xs border border-edge-light dark:border-edge-dark">Cancel</button>
              <button onClick={runPhotoEstimate} className="flex-1 py-2 rounded-lg text-xs bg-navy dark:bg-volt text-volt dark:text-navy font-semibold">Continue</button>
            </div>
          </div>
        )}
        {loading && <p className="text-sm text-ink/50 dark:text-paper/50">Estimating…</p>}
        {aiResult && (
          <div>
            <p className="font-display text-2xl font-semibold">
              {aiResult.estimatedRange.low}–{aiResult.estimatedRange.high}%
            </p>
            <p className="text-xs text-ink/50 dark:text-paper/50 capitalize mb-2">Confidence: {aiResult.confidence}</p>
            <ul className="text-[11px] text-ink/40 dark:text-paper/40 list-disc pl-4 flex flex-col gap-0.5">
              {aiResult.limitations.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Water / habits / sleep — lightweight daily trackers
// ---------------------------------------------------------------------------
export function WaterTracker({ water, onAdd, onSetTarget }) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [target, setTarget] = useState(String(water.targetMl || 2500));

  const pct = Math.min(
    ((water.amountMl || 0) / (water.targetMl || 2500)) * 100,
    100
  );

  function saveTarget() {
    const value = Number(target);

    if (!value || value < 500) return;

    onSetTarget?.(value);
    setEditingTarget(false);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-protein" />
          <p className="font-medium text-sm">Water</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTarget(String(water.targetMl || 2500));
            setEditingTarget(true);
          }}
          className="text-xs text-ink/40 dark:text-paper/40 tabular-nums"
        >
          {water.amountMl || 0} / {water.targetMl || 2500} mL
        </button>
      </div>

      <div className="h-2 rounded-full bg-ink/10 dark:bg-paper/10 overflow-hidden mb-3">
        <div
          className="h-full bg-protein rounded-full"
          style={{
            width: `${pct}%`,
            transition: 'width 0.3s'
          }}
        />
      </div>

      {editingTarget && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="500"
            step="100"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder="Daily target (mL)"
          />

          <button
            type="button"
            onClick={saveTarget}
            className="px-4 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy text-xs font-semibold"
          >
            Save
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {[250, 500, 750].map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => onAdd(ml)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-edge-light dark:border-edge-dark"
          >
            +{ml}mL
          </button>
        ))}
      </div>
    </div>
  );
}

export function HabitTracker({ habits, onToggle }) {
  const list = [
    ['workout', 'Workout'],
    ['protein', 'Protein target'],
    ['water', 'Water'],
    ['sleep', 'Sleep'],
    ['steps', 'Steps']
  ];
  return (
    <div className="card p-4">
      <p className="font-medium text-sm mb-3">Today's habits</p>
      <div className="flex flex-wrap gap-2">
        {list.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${habits?.[key] ? 'bg-fiber/20 text-fiber border-fiber/40' : 'border-edge-light dark:border-edge-dark text-ink/50 dark:text-paper/50'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SleepLogForm({ onSave, onClose }) {
  const [totalHours, setTotalHours] = useState('');
  const [quality, setQuality] = useState('ok');
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold flex items-center gap-2"><Moon size={16} /> Log sleep</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <input type="number" step="0.5" placeholder="Total hours" className={inputCls} value={totalHours} onChange={(e) => setTotalHours(e.target.value)} />
        <div className="flex gap-2">
          {['poor', 'ok', 'good'].map((q) => (
            <button key={q} onClick={() => setQuality(q)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize border ${quality === q ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}>
              {q}
            </button>
          ))}
        </div>
        <button
          disabled={!totalHours}
          onClick={() => onSave({ totalHours: Number(totalHours), quality })}
          className="py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export { Plus };

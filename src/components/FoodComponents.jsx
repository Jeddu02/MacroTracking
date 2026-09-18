import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Check, X, Plus, Trash2, Upload, ChevronRight, ScanBarcode } from 'lucide-react';
import { analyzeFoodPhoto } from '../services/foodAnalysisService.js';
import { MEAL_LABELS } from '../utils/macros.js';
import { Html5Qrcode } from 'html5-qrcode';

// ---------------------------------------------------------------------------
// Camera capture
// ---------------------------------------------------------------------------
export function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('environment');
  const [photo, setPhoto] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        setError(null);
        setCameraReady(false);
        setResolution('');

        stopStream();

        if (!navigator.mediaDevices?.getUserMedia) {
          setError('unsupported');
          return;
        }

        const constraints = {
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: {
              min: 1280,
              ideal: 1920,
              max: 3840
            },
            height: {
              min: 720,
              ideal: 1080,
              max: 2160
            },
            aspectRatio: {
              ideal: 16 / 9
            }
          }
        };

        let stream;

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing
            },
            audio: false
          });
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;

          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });

          try {
            await video.play();
          } catch {
            // Ignore autoplay errors.
          }

          const track = stream.getVideoTracks()[0];

          if (track?.applyConstraints) {
            try {
              await track.applyConstraints({
                width: {
                  min: 1280,
                  ideal: 1920,
                  max: 3840
                },
                height: {
                  min: 720,
                  ideal: 1080,
                  max: 2160
                },
                aspectRatio: {
                  ideal: 16 / 9
                }
              });
            } catch {
              // Keep the resolution selected by the browser.
            }
          }

          const settings = track?.getSettings?.();

          if (settings?.width && settings?.height) {
            setResolution(`${settings.width} × ${settings.height}`);
          } else if (video.videoWidth && video.videoHeight) {
            setResolution(`${video.videoWidth} × ${video.videoHeight}`);
          }

          setCameraReady(true);
        }
      } catch (e) {
        console.error('Camera error:', e);

        if (
          e?.name === 'NotAllowedError' ||
          e?.name === 'SecurityError'
        ) {
          setError('permission');
        } else if (e?.name === 'NotFoundError') {
          setError('not-found');
        } else {
          setError('camera');
        }
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
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d', {
      alpha: false
    });

    if (!context) return;

    context.drawImage(
      video,
      0,
      0,
      video.videoWidth,
      video.videoHeight
    );

    const image = canvas.toDataURL('image/jpeg', 0.94);

    setPhoto(image);
    stopStream();
  }

  function handleUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhoto(reader.result);
    };

    reader.readAsDataURL(file);

    e.target.value = '';
  }

  function switchCamera() {
    setCameraReady(false);
    setFacing((current) =>
      current === 'environment' ? 'user' : 'environment'
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
        <Camera size={32} className="opacity-70" />

        <p className="max-w-xs text-sm opacity-80">
          {error === 'unsupported'
            ? 'Your browser does not support camera access.'
            : error === 'not-found'
              ? 'No camera was found on this device.'
              : 'Camera access was denied or the camera is unavailable.'}
        </p>

        <label className="bg-volt text-navy font-semibold rounded-xl px-5 py-3 cursor-pointer flex items-center gap-2">
          <Upload size={16} />
          Upload Photo Instead

          <input
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={handleUpload}
/>
        </label>

       <button
  type="button"
  onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (photo) {
    return (
      <ConfirmPhoto
        photo={photo}
        onRetake={() => setPhoto(null)}
        onConfirm={() => onCapture(photo)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col mf-scale-in">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 w-full h-full object-cover"
      />

      {/* Food framing guide */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[82%] max-w-md aspect-[4/3] border-2 border-white/60 rounded-3xl" />
      </div>

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 mf-slide-down">
        <button
          onClick={onCancel}
          className="p-2.5 rounded-full bg-black/50 text-white"
          aria-label="Close camera"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2">
          {resolution && (
            <div className="px-3 py-1.5 rounded-full bg-black/50 text-white text-[11px]">
              {resolution}
            </div>
          )}

         <button
  type="button"
  onClick={switchCamera}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {!cameraReady && (
        <div className="absolute top-20 left-0 right-0 flex justify-center">
          <div className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
            Starting camera…
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 pb-10 pt-6 bg-gradient-to-t from-black/70 to-transparent">
        <label className="p-3 rounded-full bg-white/20 text-white cursor-pointer">
          <Upload size={20} />

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        <button
  type="button"
  onClick={capture}
          disabled={!cameraReady}
          aria-label="Take photo"
          className={`w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-95 transition-transform mf-pop mf-interactive ${
            cameraReady
              ? 'opacity-100'
              : 'opacity-40 cursor-not-allowed'
          }`}
        />

        <div className="w-11" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barcode scanner
// ---------------------------------------------------------------------------
export function BarcodeScanner({ onResult, onCancel }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);

  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const scanner = new Html5Qrcode('barcode-reader');

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: {
              width: 280,
              height: 140
            },
            aspectRatio: 1.777778
          },
          async (decodedText) => {
            if (!mounted || startedRef.current) return;

            startedRef.current = true;
            setScanning(false);

            try {
              await scanner.stop();
            } catch {
              // Scanner may already have stopped.
            }

            onResult(decodedText);
          },
          () => {
            // Ignore normal scan misses.
          }
        );
      } catch (err) {
        console.error('Barcode scanner error:', err);

        if (mounted) {
          setError(
            err?.message ||
            'Unable to access the camera for barcode scanning.'
          );
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });
      }
    };
  }, [onResult]);

  function submitManualCode(e) {
    e.preventDefault();

    const code = manualCode.trim();

    if (!code) return;

    startedRef.current = true;
    setScanning(false);
    onResult(code);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white mf-scale-in">
      <header className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={onCancel}
          className="p-2.5 rounded-full bg-white/10"
          aria-label="Close barcode scanner"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2">
          <ScanBarcode size={20} />
          <span className="font-semibold">Scan Barcode</span>
        </div>

        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {!error && scanning && (
          <>
            <div
              id="barcode-reader"
              className="w-full max-w-md overflow-hidden rounded-2xl"
            />

            <div className="mt-5 text-center">
              <p className="font-semibold">
                Point your camera at a barcode
              </p>

              <p className="text-xs text-white/60 mt-2 max-w-xs">
                Keep the barcode inside the scanning area until it is
                detected.
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="w-full max-w-md text-center">
            <ScanBarcode
              size={42}
              className="mx-auto mb-4 opacity-60"
            />

            <p className="font-semibold">
              Barcode camera unavailable
            </p>

            <p className="text-xs text-white/60 mt-2 mb-5">
              You can enter the barcode number manually instead.
            </p>
          </div>
        )}

        <form
          onSubmit={submitManualCode}
          className="w-full max-w-md mt-8"
        >
          <label className="text-xs text-white/50">
            Enter barcode manually
          </label>

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 4800012345678"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-3 text-white outline-none"
            />

            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 rounded-xl bg-volt text-navy font-semibold disabled:opacity-40"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <footer className="p-5">
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-white/20 text-white/80"
        >
          Cancel
        </button>
      </footer>
    </div>
  );
}

function ConfirmPhoto({ photo, onRetake, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <img
        src={photo}
        alt="Captured food"
        className="flex-1 w-full h-full object-cover mf-fade-in"
      />

      <div className="flex gap-3 p-5 bg-black">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 py-3 rounded-xl border border-white/30 text-white font-medium"
        >
          Retake
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-volt text-navy font-semibold"
        >
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
    <div className="fixed inset-0 z-50 bg-navy flex flex-col items-center justify-center gap-5 text-paper mf-scale-in">
      <div className="mf-pulse-soft">
        <div className="w-16 h-16 rounded-full border-4 border-volt/20 border-t-volt animate-spin" />
      </div>

      <div className="text-center mf-slide-up">
        <p className="font-display text-lg font-semibold">
          Analyzing food…
        </p>

        <p className="text-xs opacity-60 max-w-xs text-center mt-2">
          Identifying items and estimating portions. You'll be able to review
          and edit everything before it's logged.
        </p>
      </div>

      <div className="w-40 h-1 rounded-full bg-paper/10 overflow-hidden mf-fade-in">
        <div className="h-full w-1/2 bg-volt rounded-full animate-pulse" />
      </div>
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
    <div className="fixed inset-0 z-50 bg-paper dark:bg-ink flex flex-col mf-page">
      <header className="flex items-center justify-between p-4 border-b border-edge-light dark:border-edge-dark mf-slide-down">
        <button onClick={onCancel} className="text-sm text-ink/50 dark:text-paper/50">Cancel</button>
        <span className="font-display font-semibold">Review & confirm</span>
        <span className="w-12" />
      </header>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 mf-stagger">
        <p className="text-xs text-ink/50 dark:text-paper/50 -mt-1">
          Logging to <strong>{MEAL_LABELS[meal]}</strong>. Nothing is saved until you confirm — edit anything that looks off.
        </p>
        {foods.map((f, i) => editableFoodRow(f, i, updateFood, removeFood))}
        <button onClick={addBlank} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-edge-light dark:border-edge-dark text-sm text-ink/60 dark:text-paper/60">
          <Plus size={16} /> Add Food
        </button>
      </div>
     <footer className="p-4 border-t border-edge-light dark:border-edge-dark flex flex-col gap-3 mf-slide-up">
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
           className="flex-[2] py-3 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy font-semibold flex items-center justify-center gap-2 mf-interactive mf-pop"
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
     <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center mf-fade-in">
        <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto mf-slide-up">
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center mf-fade-in">
      <div className="bg-surface-light dark:bg-surface-dark rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 flex flex-col gap-3 max-h-[85vh] mf-slide-up">
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
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-1 px-1 mf-stagger">
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
         className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-edge-light dark:border-edge-dark text-sm mf-interactive"
        >
          <Plus size={15} /> Create custom food
        </button>
      </div>
    </div>
  );
}

export { analyzeFoodPhoto, Camera };

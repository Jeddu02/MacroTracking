import { useRef, useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { db } from '../db/database.js';
import { calcTargets } from '../services/nutritionCalc.js';

const inputCls = 'rounded-xl border border-edge-light dark:border-edge-dark bg-transparent px-3 py-2 text-sm';

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink/60 dark:text-paper/60">{title}</h2>
      <div className="card p-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { profile, settings, saveProfile, overrideTargets, saveSettings, resetAllData } = useApp();
  const fileInputRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localTargets, setLocalTargets] = useState(profile?.targets || {});
  const [savedMsg, setSavedMsg] = useState('');

  if (!profile) return null;

  function flash(msg) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 1800);
  }

  async function updateField(key, value) {
    await saveProfile({ [key]: value });
    flash('Saved');
  }

  async function recalcTargets() {
    const t = calcTargets(profile);
    await saveProfile({ targets: t, targetsOverridden: false });
    setLocalTargets(t);
    flash('Recalculated');
  }

  async function saveTargetOverrides() {
    await overrideTargets({
      calories: Number(localTargets.calories),
      protein: Number(localTargets.protein),
      carbs: Number(localTargets.carbs),
      fat: Number(localTargets.fat)
    });
    flash('Targets updated');
  }

  async function exportJSON() {
    const dump = await db.exportAll();
    downloadFile(`macrofit-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), 'application/json');
  }

  async function exportCSV() {
    const logs = await db.getAll('foodLogs');
    const header = 'date,meal,name,serving,unit,calories,protein,carbs,fat,fiber\n';
    const rows = logs
      .map((l) => [l.date, l.meal, `"${l.name}"`, l.serving, l.unit, l.calories, l.protein, l.carbs, l.fat, l.fiber].join(','))
      .join('\n');
    downloadFile(`macrofit-food-logs-${new Date().toISOString().slice(0, 10)}.csv`, header + rows, 'text/csv');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const dump = JSON.parse(text);
      await db.importAll(dump);
      flash('Data imported — reload to see it everywhere');
    } catch {
      flash('Import failed — invalid file');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        {savedMsg && <span className="text-xs text-fiber font-medium">{savedMsg}</span>}
      </header>

      <Section title="Personal information">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Name
            <input className={inputCls} defaultValue={profile.name} onBlur={(e) => updateField('name', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Age
            <input type="number" className={inputCls} defaultValue={profile.age} onBlur={(e) => updateField('age', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Height (cm)
            <input type="number" className={inputCls} defaultValue={profile.heightCm} onBlur={(e) => updateField('heightCm', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Weight (kg)
            <input type="number" className={inputCls} defaultValue={profile.weightKg} onBlur={(e) => updateField('weightKg', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Waist (cm)
            <input type="number" className={inputCls} defaultValue={profile.waistCm} onBlur={(e) => updateField('waistCm', Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50">
            Neck (cm)
            <input type="number" className={inputCls} defaultValue={profile.neckCm} onBlur={(e) => updateField('neckCm', Number(e.target.value))} />
          </label>
        </div>
      </Section>

      <Section title="Goals & macro targets">
        <p className="text-xs text-ink/50 dark:text-paper/50 -mt-1">
          Estimated from your stats — general fitness guidance, not medical advice. Override anytime.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {['calories', 'protein', 'carbs', 'fat'].map((key) => (
            <label key={key} className="flex flex-col gap-1 text-xs text-ink/50 dark:text-paper/50 capitalize">
              {key}
              <input
                type="number"
                className={inputCls}
                value={localTargets[key] ?? profile.targets?.[key] ?? ''}
                onChange={(e) => setLocalTargets((t) => ({ ...t, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={recalcTargets} className="flex-1 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium">
            Recalculate
          </button>
          <button onClick={saveTargetOverrides} className="flex-1 py-2.5 rounded-xl bg-navy dark:bg-volt text-volt dark:text-navy text-sm font-semibold">
            Save Overrides
          </button>
        </div>
      </Section>

      <Section title="Preferences">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <div className="flex gap-1 bg-ink/5 dark:bg-paper/5 rounded-full p-1">
            <button onClick={() => saveSettings({ theme: 'light' })} className={`p-1.5 rounded-full ${settings?.theme === 'light' ? 'bg-surface-light shadow-sm' : ''}`}>
              <Sun size={15} />
            </button>
            <button onClick={() => saveSettings({ theme: 'dark' })} className={`p-1.5 rounded-full ${settings?.theme === 'dark' ? 'bg-surface-dark shadow-sm' : ''}`}>
              <Moon size={15} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Units</span>
          <div className="flex gap-2">
            <button onClick={() => saveSettings({ units: 'metric' })} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${settings?.units === 'metric' ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}>kg/cm</button>
            <button onClick={() => saveSettings({ units: 'imperial' })} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${settings?.units === 'imperial' ? 'bg-navy dark:bg-volt text-volt dark:text-navy border-transparent' : 'border-edge-light dark:border-edge-dark'}`}>lb/ft-in</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifications</span>
          <button
            onClick={() => saveSettings({ notifications: !settings?.notifications })}
            className={`w-10 h-6 rounded-full relative transition-colors ${settings?.notifications ? 'bg-volt' : 'bg-ink/15 dark:bg-paper/15'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings?.notifications ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
      </Section>

      <Section title="Privacy & AI">
        <div className="flex items-start gap-2.5 text-xs text-ink/60 dark:text-paper/60">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-fiber" />
          <p>
            All logs, workouts and photos are stored on this device. Food photo analysis and the experimental body-composition
            estimate currently run as a local mock — no image leaves your device. Connecting a real AI service is a config
            change in <code>src/services/</code> (see the README), and you'll always be asked before any photo upload.
          </p>
        </div>
      </Section>

      <Section title="Data">
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={exportJSON} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium">
            <Download size={15} /> Export JSON
          </button>
          <button onClick={exportCSV} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium">
            <Download size={15} /> Export CSV
          </button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm font-medium"
        >
          <Upload size={15} /> Import Backup (JSON)
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-coral/40 text-coral text-sm font-medium">
            <Trash2 size={15} /> Delete All Data
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-coral">This permanently deletes everything on this device. This can't be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-edge-light dark:border-edge-dark text-sm">Cancel</button>
              <button onClick={resetAllData} className="flex-1 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold">Delete Everything</button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { db } from '../db/database.js';
import { seedDemoData, isFirstLaunch } from '../db/seedData.js';
import { calcTargets } from '../services/nutritionCalc.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const first = await isFirstLaunch();
    if (first && localStorage.getItem('macrofit_skip_seed') !== '1') {
      // Nothing exists yet — the app itself decides in App.jsx whether to run
      // onboarding or demo seed; here we just load whatever is there.
    }
    const p = await db.get('profile', 'me');
    const s = (await db.get('settings', 'app')) || { id: 'app', theme: 'dark', units: 'metric', notifications: true };
    setProfile(p || null);
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  const loadDemoData = useCallback(async () => {
    await seedDemoData();
    await bootstrap();
  }, [bootstrap]);

  const saveProfile = useCallback(async (patch) => {
    const current = (await db.get('profile', 'me')) || { id: 'me' };
    const merged = { ...current, ...patch, id: 'me' };
    if (!merged.targetsOverridden && merged.sex && merged.weightKg && merged.heightCm && merged.age) {
      merged.targets = calcTargets(merged);
    }
    const saved = await db.put('profile', merged);
    setProfile(saved);
    return saved;
  }, []);

  const overrideTargets = useCallback(async (targets) => {
    const current = (await db.get('profile', 'me')) || { id: 'me' };
    const saved = await db.put('profile', { ...current, targets, targetsOverridden: true });
    setProfile(saved);
    return saved;
  }, []);

  const saveSettings = useCallback(async (patch) => {
    const current = (await db.get('settings', 'app')) || { id: 'app' };
    const saved = await db.put('settings', { ...current, ...patch, id: 'app' });
    setSettings(saved);
    return saved;
  }, []);

  const resetAllData = useCallback(async () => {
    await db.clearAll();
    setProfile(null);
    setSettings({ id: 'app', theme: 'dark', units: 'metric', notifications: true });
  }, []);

  const value = {
    profile,
    settings,
    loading,
    online,
    saveProfile,
    overrideTargets,
    saveSettings,
    resetAllData,
    loadDemoData,
    refresh: bootstrap
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

import { createContext, useContext, useEffect, useRef, useState } from 'react';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('');
  const endsAtRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      const msLeft = endsAtRef.current - Date.now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setRemaining(secLeft);
      if (secLeft <= 0) {
        setRunning(false);
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      }
    }, 250);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function start(seconds, restLabel = 'Rest') {
    const secs = seconds ?? duration;
    setDuration(secs);
    setRemaining(secs);
    setLabel(restLabel);
    endsAtRef.current = Date.now() + secs * 1000;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function resume() {
    endsAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setRemaining(0);
  }

  function addSeconds(delta) {
    endsAtRef.current += delta * 1000;
    setRemaining((r) => Math.max(0, r + delta));
  }

  const value = { duration, remaining, running, label, start, pause, resume, reset, addSeconds, setDuration };
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useRestTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useRestTimer must be used within TimerProvider');
  return ctx;
}

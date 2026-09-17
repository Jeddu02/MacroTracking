import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Food from './pages/Food.jsx';
import Workout from './pages/Workout.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  const { profile, loading, online } = useApp();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-volt/30 border-t-volt animate-spin" />
          <span className="font-display text-sm tracking-wide opacity-80">MacroFit</span>
        </div>
      </div>
    );
  }

  if (!profile || !profile.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <>
      {!online && (
        <div className="bg-navy text-volt text-xs text-center py-1 font-medium tracking-wide">
          Offline mode — manual logging, history and workouts still work
        </div>
      )}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/food" element={<Food />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

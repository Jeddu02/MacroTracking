import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, UtensilsCrossed, Dumbbell, TrendingUp, User, Camera, Pause, Play, X } from 'lucide-react';
import { useRestTimer } from '../context/TimerContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: User }
];

function NavItems({ vertical }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl transition-colors ${
              vertical ? 'px-4 py-3 w-full' : 'flex-col justify-center py-2 flex-1 gap-1'
            } ${
              isActive
                ? 'text-navy dark:text-volt bg-volt/90 dark:bg-volt/10'
                : 'text-ink/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper'
            }`
          }
        >
          <Icon size={vertical ? 20 : 22} strokeWidth={2.25} />
          <span className={vertical ? 'text-sm font-medium' : 'text-[11px] font-medium'}>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

function FloatingTimer() {
  const timer = useRestTimer();
  const navigate = useNavigate();
  if (timer.remaining <= 0 && !timer.running) return null;

  const mins = Math.floor(timer.remaining / 60);
  const secs = timer.remaining % 60;

  return (
    <button
      onClick={() => navigate('/workout')}
      className="fixed z-40 bottom-24 md:bottom-6 right-4 md:right-6 card shadow-lg px-4 py-3 flex items-center gap-3 active:scale-95 transition-transform"
    >
      <div className="text-lg font-display font-semibold tabular-nums text-navy dark:text-volt">
        {mins}:{String(secs).padStart(2, '0')}
      </div>
      <div className="text-xs text-ink/50 dark:text-paper/50 max-w-[90px] truncate">{timer.label}</div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          timer.running ? timer.pause() : timer.resume();
        }}
        className="p-1.5 rounded-full bg-volt/20 text-navy dark:text-volt"
      >
        {timer.running ? <Pause size={14} /> : <Play size={14} />}
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          timer.reset();
        }}
        className="p-1 text-ink/40 dark:text-paper/40"
      >
        <X size={14} />
      </span>
    </button>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col gap-1 p-4 border-r border-edge-light dark:border-edge-dark">
        <div className="px-3 py-4 mb-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            Macro<span className="text-volt">Fit</span>
          </span>
        </div>
        <NavItems vertical />
        <button
          onClick={() => navigate('/food?action=scan')}
          className="mt-4 mx-3 flex items-center justify-center gap-2 bg-navy dark:bg-volt text-volt dark:text-navy font-semibold rounded-xl py-3 text-sm"
        >
          <Camera size={18} /> Scan Food
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur border-t border-edge-light dark:border-edge-dark flex px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
          <NavItems />
        </nav>
      </div>

      <FloatingTimer />
    </div>
  );
}

const COLORS = {
  calories: '#C6F135',
  protein: '#3D8BFF',
  carbs: '#FFB020',
  fat: '#FF6B6B',
  fiber: '#4BBF8C',
  water: '#3DC7FF'
};

export function ProgressRing({ value, target, color = COLORS.calories, size = 96, stroke = 9, children }) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring-track text-ink dark:text-paper" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {children && (
        <foreignObject x="0" y="0" width={size} height={size} className="rotate-90" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          {children}
        </foreignObject>
      )}
    </svg>
  );
}

export function CalorieRing({ consumed, target }) {
  const remaining = Math.max(target - consumed, 0);
  return (
    <div className="relative flex items-center justify-center">
      <ProgressRing value={consumed} target={target} size={140} stroke={12} color={COLORS.calories} />
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-semibold tabular-nums">{Math.round(remaining)}</span>
        <span className="text-[11px] text-ink/50 dark:text-paper/50">kcal left</span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, color }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-ink/50 dark:text-paper/50">
          {Math.round(value)}/{Math.round(target)}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-ink/10 dark:bg-paper/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export function MacroSummary({ totals, targets }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-6">
        <CalorieRing consumed={totals.calories} target={targets.calories} />
        <div className="flex-1 flex flex-col gap-3">
          <MacroBar label="Protein" value={totals.protein} target={targets.protein} color={COLORS.protein} />
          <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color={COLORS.carbs} />
          <MacroBar label="Fat" value={totals.fat} target={targets.fat} color={COLORS.fat} />
        </div>
      </div>
    </div>
  );
}

export { COLORS };

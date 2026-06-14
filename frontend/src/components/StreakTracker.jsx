import { Zap, TrendingUp, AlertTriangle } from 'lucide-react';

const streakIcons = { LOW: Zap, MEDIUM: TrendingUp, HIGH: AlertTriangle };
const streakColors = { LOW: 'text-cyan', MEDIUM: 'text-acid', HIGH: 'text-danger' };
const streakBg = { LOW: 'bg-cyan/10', MEDIUM: 'bg-acid/10', HIGH: 'bg-danger/10' };
const streakBorder = { LOW: 'border-cyan/25', MEDIUM: 'border-acid/25', HIGH: 'border-danger/25' };

export default function StreakTracker({ streaks }) {
  if (!streaks) return null;

  const { current_streak: current, longest_streaks: longest } = streaks;

  const Icon = current?.category ? streakIcons[current.category] : Zap;
  const color = current?.category ? streakColors[current.category] : 'text-slate-400';
  const bg = current?.category ? streakBg[current.category] : 'bg-slate-800';
  const border = current?.category ? streakBorder[current.category] : 'border-slate-700';

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Streak Tracker</h2>
        <p className="text-xs text-slate-500">Consecutive round patterns</p>
      </div>

      {/* Current streak */}
      <div className={`mb-5 rounded-xl border ${border} ${bg} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className="text-xs text-slate-400">Current Streak</div>
              <div className={`text-xl font-black ${color}`}>
                {current?.category || '--'} <span className="text-2xl">×</span> {current?.length || 0}
              </div>
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${color} ${bg}`}>
            {current?.active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Longest streaks */}
      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Longest Streaks</div>
        <div className="grid grid-cols-3 gap-3">
          {['LOW', 'MEDIUM', 'HIGH'].map((cat) => (
            <div
              key={cat}
              className={`rounded-lg border ${streakBorder[cat]} ${streakBg[cat]} p-3 text-center`}
            >
              <div className={`text-lg font-black ${streakColors[cat]}`}>{longest?.[cat] || 0}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{cat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

